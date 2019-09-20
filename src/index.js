import AWS from 'aws-sdk';
import Promise from 'bluebird';
import Youtube from './youtube';
import GoogleAuthClient from './google-auth-client';
import { google } from 'googleapis';

AWS.config.setPromisesDependency(Promise);
AWS.config.update({region: process.env.AWS_REGION});


const googleAuthClient = new GoogleAuthClient({
    google
});

const s3 = new AWS.S3();

async function consume(event, context) {
    console.log('got here - 3')
    const youtube = new Youtube({
        google,
        googleAuthClient
    });
    console.log('got here - 4');
    const bucket = event.Records[0].s3.bucket.name;
    const fileKey = event.Records[0].s3.object.key;
    const params = {
        Bucket: bucket,
        Key: fileKey
    };

    let video;
    console.log('params - ', params);
    try {
        video = await s3.getObject(params).promise();
    } catch(error) {
        throw new Error(`An error occurred while downloading data from S3 in the Youtube Uploader Lambda: ${error.message}`);
    }
    console.log('got here - 6');
    try {
        await youtube.upload(video)
    } catch (error) {
        throw new Error(`An error occurred while upload video data to Youtube in the Youtube Uploader Lambda: ${error.message}`);
    }
    return {};
}

exports.handler = async (event, context) => {
    try {
        return await consume(event,context);
    } catch (error) {
        throw new Error(`An error occurred in the Youtube Upload Lambda: ${error.message}`);
    }
};