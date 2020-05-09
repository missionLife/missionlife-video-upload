from google.oauth2 import service_account
from oauth2client.client import GoogleCredentials
import httplib2
import googleapiclient.discovery
from googleapiclient.http import MediaFileUpload
import boto3
import os
import json
import requests


class SlackBot:
    def __init__(self, app_id, secret_id, token):
        """
        Get an "incoming-webhook" URL from your slack account.
        @see https://api.slack.com/incoming-webhooks
        eg: https://hooks.slack.com/services/<app_id>/<secret_id>/<token>
        """
        self._url = "https://hooks.slack.com/services/%s/%s/%s" % (
            app_id,
            secret_id,
            token,
        )

    def slack_it(self, msg):
        """ Send a message to a predefined slack channel."""
        print("THE URL - %s" %(self._url))
        headers = {"content-type": "application/json"}
        data = '{"text":"%s"}' % msg
        resp = requests.post(self._url, data=data, headers=headers)
        return "Message Sent" if resp.status_code == 200 else "Failed to send message"

def configure_s3():
    return boto3.client('s3')


def configure_youtube():
    cred = GoogleCredentials(None, os.environ.get('GOOGLE_CLIENT_ID'), os.environ.get('GOOGLE_CLIENT_SECRET'),
                                            os.environ.get('GOOGLE_REFRESH_TOKEN'), None, "https://accounts.google.com/o/oauth2/token", '')
    http = cred.authorize(httplib2.Http())
    cred.refresh(http)

    api_service_name = "youtube"
    api_version = "v3"

    return googleapiclient.discovery.build(
        api_service_name, api_version, credentials=cred, cache_discovery=False)

def get_content_ownwer_id(id):
    print('Printing Foundation Name: %s' %(id))
    switcher={
        'Exodo Foundation':'UCAqceSEsBuj12sgmhm4V_Wg',
        'Africa Hope Initiative':'UCF-f1iCKVO78vMhW8XXxX1g',
        'Fundacion Formavida':'UCIqwpPyebBzHb0fgVPmtzpA',
        'Mision Emanuel':'UCMGaesRqkxw12XpmHeqk2iw'
    }
    return switcher.get(id,"UC7myIy6bDvluGDQerm90qIw")


def handler(event, context):
    s3_key = event['Records'][0]['s3']['object']['key']
    file_name = s3_key.split('/')[1]

    print(s3_key)
    print(file_name)
    
    file_path = '/tmp/%s' %(file_name)

    youtube = configure_youtube()
    s3 = configure_s3()

    # download the video file
    s3.download_file('mission-life-youtube-data-api-upload', s3_key, file_path)

    # download the metadata file
    metadata_response = s3.get_object(Bucket='mission-life-youtube-data-api-upload', Key=s3_key)
    
    print(metadata_response)
    print(metadata_response['Metadata'])

    metadata_string = metadata_response['Metadata']['person-metadata']

    metadata = json.loads(metadata_string)

    partner = metadata['partner']
    content_owner_id = get_content_ownwer_id(partner)

    print('Content Owner ID: %s' %(content_owner_id))

    print(metadata)

    date = metadata['upload'][0 : 10]

    request = youtube.videos().insert(
        part="snippet,status",
        body={
            "snippet": {
                "categoryId": "22",
                "description": 'Message from %s' % (metadata['supporter']),
                "title": 'VIDEO MSG - %s - %s - %s - %s' % (metadata['partner'], metadata['sponsorship'], date, metadata['supporter']),
                "tags": [metadata['sponsorship'], metadata['partner']]
            },
            "status": {
                "privacyStatus": "unlisted"
            }
        },
        media_body=MediaFileUpload(file_path)
    )

    response = request.execute()

    app_id = "TDTDXKYDR"
    secret_id = "B011KHTSP54"
    token = os.environ.get('SLACK_API_TOKEN')
    
    slack = SlackBot(app_id, secret_id, token)
    slack_message = """
    <!channel> A new video titled *'Message from %s_%s'* was just uploaded to Youtube for *Sponsorship: %s* - *Partner: %s*. \nPlease login to Youtube Studio to update translations at https://studio.youtube.com/channel/UCIqwpPyebBzHb0fgVPmtzpA/videos/upload
    """ % (metadata['supporter'], metadata['upload'], metadata['sponsorship'], metadata['partner'])

    print('Slack Message: %s' %(slack_message))

    res = slack.slack_it(slack_message)

    print('Slack response: %s' %(res))

    # delete the temp file
    os.remove(file_path)
    return 'okay'