import AWS from 'aws-sdk';
import Promise from 'bluebird';
import YoutubeUploader from './youtube-uploader';

AWS.config.setPromisesDependency(Promise);
AWS.config.update({region: process.env.AWS_REGION});

const s3 = new AWS.S3();
const youtubeUploader = new YoutubeUploader;

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

    // TODO: import YoutubeUploader
    try {
        await youtubeUploader.upload(video)
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