import AWS from 'aws-sdk';
import Promise from 'bluebird';

AWS.config.setPromisesDependency(Promise);
AWS.config.update({region: process.env.AWS_REGION});

exports.handler = async (event, context) => {
    try {
        return await consume(event,context);
    } catch (error) {
        throw new Error(`An error occurred in the Youtube Upload Lambda: ${error.message}`);
    }
};