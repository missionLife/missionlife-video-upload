from google.oauth2 import service_account
from oauth2client.client import GoogleCredentials
import httplib2
import googleapiclient.discovery
from googleapiclient.http import MediaFileUpload
import boto3
import os
import json

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

def handler(event, context):
    s3_key = event['Records'][0]['s3']['object']['key']
    file_path = '/tmp/%s' %(s3_key)
    meta_file_path = file_path + '.json'

    if (s3_key.endswith('.json')):
        print('Ignoring metadata file.')
        return 'okay'

    youtube = configure_youtube()
    s3 = configure_s3()

    # download the video file
    s3.download_file('mission-life-youtube-upload-master', s3_key, file_path)

    # download the metadata file
    metadata_response = s3.get_object(Bucket='mission-life-youtube-upload-master', Key=s3_key)
    
    print(metadata_response)

    metadata = metadata_response.Metadata

    print(metadata)
    print(s3_key)

    request = youtube.videos().insert(
        part="snippet,status",
        body={
            "snippet": {
                "categoryId": "22",
                "description": 'Message from %s' % (metadata['supporter']),
                "title": 'Message from %s' % (metadata['supporter']),
                "tags": [metadata['sponsorship'], metadata['partner']]
            },
            "status": {
                "privacyStatus": "private"
            }
        },
        media_body=MediaFileUpload(file_path)
    )

    response = request.execute()

    # delete the temp file
    os.remove(file_path)
    return 'okay'
