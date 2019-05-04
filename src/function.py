from google.oauth2 import service_account
from oauth2client.client import GoogleCredentials
import httplib2
import googleapiclient.discovery
from googleapiclient.http import MediaFileUpload
import boto3
import os
import json

def configure_s3():
    return boto3.client(
        's3',
        aws_access_key_id='AKIATSRTY4JEELYVDAD4',
        aws_secret_access_key='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')


def configure_youtube():
    cred = GoogleCredentials(None, '516539232105-tmrsqt0nmulkv0esv5rm0tcs7qi2crop.apps.googleusercontent.com', 'bJinCKtxvlPTuhvIpKcz8KQK',
                                            '1/v0GHMXngPNROfKHUwyqrvuwyMuhkix_5RIyFF2Sflwo', None, "https://accounts.google.com/o/oauth2/token", '')
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
    s3.download_file('mission-life-videos', s3_key, file_path)

    # download the metadata file
    s3.download_file('mission-life-videos', s3_key + '.json', meta_file_path)

    # read the metadata file
    with open(meta_file_path, 'r') as f:
        metadata = json.load(f)

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