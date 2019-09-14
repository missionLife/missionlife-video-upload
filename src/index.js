import AWS from 'aws-sdk';
import Promise from 'bluebird';
import Youtube from './youtube';
import GoogleAuthClient from './google-auth-client';
import google from 'googleapis';

AWS.config.setPromisesDependency(Promise);
AWS.config.update({region: process.env.AWS_REGION});

const GOOGLE_AUTH_CLIENT_SCOPE = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
];
const googleAuthClient = new GoogleAuthClient({
    google
});
await googleAuthClient.authenticate(GOOGLE_AUTH_CLIENT_SCOPE);
const s3 = new AWS.S3();
const youtube = new Youtube({
    google,
    googleAuthClient
});

async function consume(event, context) {
    const bucket = event.Records[0].s3.bucket.name;
    const fileKey = event.Records[0].s3.object.key;
    const params = {
        Bucket: bucket,
        Key: fileKey
    };

    let video;

    try {
        video = await s3.getObject(params).promise();
    } catch(error) {
        throw new Error(`An error occurred while downloading data from S3 in the Youtube Uploader Lambda: ${error.message}`);
    }

    try {
        await youtube.upload(video)
    } catch (error) {
        throw new Error(`An error occurred while upload video data to Youtube in the Youtube Uploader Lambda: ${error.message}`);
    }
    return {};
}

async function getChannels() {
    return await youtube.getChannels();
};

exports.handler = async (event, context) => {
    try {
        // return await consume(event,context);
        return await getChannels();
    } catch (error) {
        throw new Error(`An error occurred in the Youtube Upload Lambda: ${error.message}`);
    }
};