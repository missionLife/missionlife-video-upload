import AWS from 'aws-sdk';
import Promise from 'bluebird';
import { google } from 'googleapis';
import url from 'url';
import Lien from 'lien';
import open from 'open';

AWS.config.setPromisesDependency(Promise);
AWS.config.update({region: process.env.AWS_REGION});

const KEYS = {
    "client_id": process.env.GOOGLE_CLIENT_ID,
    "project_id": "video-messaging",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": process.env.GOOGLE_CLIENT_SECRET,
    "javascript_origins": ["http://localhost:3000"],
    "redirect_uri": 'http://localhost:3000/oauth2callback'
};
const INVALID_REDIRECT_URI = `The provided keyfile does not define a valid
redirect URI. There must be at least one redirect URI defined, and this sample
assumes it redirects to 'http://localhost:3000/oauth2callback'.  Please edit
your keyfile, and add a 'redirect_uris' section.  For example:
"redirect_uris": [
  "http://localhost:3000/oauth2callback"
]
`;
const GOOGLE_AUTH_CLIENT_SCOPE = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
];

const s3 = new AWS.S3();

async function consume(event, context) {
    console.log('got here EVENT: ', event);
    const bucket = event.Records[0].s3.bucket.name;
    const fileKey = event.Records[0].s3.object.key;
    const params = {
        Bucket: bucket,
        Key: fileKey
    };

    let videoData;

    try {
        videoData = await s3.getObject(params).promise();
        console.log('got the video data')
    } catch(error) {
        throw new Error(`An error occurred while downloading data from S3 in the Youtube Uploader Lambda: ${error.message}`);
    }

    const redirectUri = KEYS.redirect_uri;
    const parts = new url.URL(redirectUri);

    if (
        redirectUri.length === 0 ||
        parts.port !== '3000' ||
        parts.hostname !== 'localhost' ||
        parts.pathname !== '/oauth2callback'
    ) {
        throw new Error(INVALID_REDIRECT_URI);
    }
    console.log('the redirect uri', redirectUri);
    
    const oAuth2Client = new google.auth.OAuth2(
        KEYS.client_id,
        KEYS.client_secret,
        redirectUri
    );
    
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        'scope': GOOGLE_AUTH_CLIENT_SCOPE,
        'access_type':'offline',
        'approval_prompt':'force',
        'response_type':'code'
    });

    console.log('The Authorization URL or Code: ', authorizeUrl);

    const server = new Lien({
        host: 'localhost', 
        port: 3000
    });
    console.log('created the server')
    open(authorizeUrl);
    console.log('called open')
    server.addPage("/oauth2callback", lien => {
        console.log("Trying to get the token using the following code: " + lien.query.code);
        this.oAuth2Client.getToken(lien.query.code, (err, tokens) => {
     
            if (err) {
                lien.lien(err, 400);
                return console.log(err);
            }
     
            console.log("Got the tokens.");
     
            oAuth2Client.setCredentials(tokens);

            const youtube = google.youtube({
                version: 'v3',
                auth: oAuth2Client,
            })

            const videoFile = fs.writeFileSync('/tmp/temp.txt', videoData.Body);
            console.log('stored file');
            const fileSize = fs.statSync('/tmp/temp.txt').size;
            console.log('Video Size: ', fileSize);
            const res = await youtube.videos.insert({
                part: 'id,snippet,status',
                notifySubscribers: false,
                requestBody: {
                    snippet: {
                        title: 'Node.js YouTube Upload Test',
                        description: 'Testing YouTube upload via Google APIs Node.js Client',
                    },
                    status: {
                        privacyStatus: 'private',
                    },
                },
                media: {
                    body: fs.createReadStream('/tmp/temp.txt'),
                },
            }, {
                // Use the `onUploadProgress` event from Axios to track the
                // number of bytes uploaded to this point.
                onUploadProgress: evt => {
                    const progress = (evt.bytesRead / fileSize) * 100;
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0, null);
                    process.stdout.write(`${Math.round(progress)}% complete`);
                },
            });
            console.log('\n\n');
            console.log(res.data);
            return res.data;
     
            lien.end("The video has been uploaded.");
        });
    });
}

exports.handler = async (event, context) => {
    try {
        return await consume(event,context);
    } catch (error) {
        throw new Error(`An error occurred in the Youtube Upload Lambda: ${error.message}`);
    }
};