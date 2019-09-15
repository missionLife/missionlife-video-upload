import http from 'http';
import url from "url";
import open from 'open';
import destroyer from 'server-destroy';
import fs from 'fs';
import path from 'path';

const KEYS = {
    "client_id": process.env.GOOGLE_CLIENT_ID,
    "project_id": "video-messaging",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": process.env.GOOGLE_CLIENT_SECRET,
    "javascript_origins": ["http://localhost:3000"],
    "redirect_uris": ['http://localhost:3000/oauth2callback'],
};
const INVALID_REDIRECT_URI = `The provided keyfile does not define a valid
redirect URI. There must be at least one redirect URI defined, and this sample
assumes it redirects to 'http://localhost:3000/oauth2callback'.  Please edit
your keyfile, and add a 'redirect_uris' section.  For example:
"redirect_uris": [
  "http://localhost:3000/oauth2callback"
]
`;

export default class GoogleAuthClient {
    constructor({ google }) {
        this.google = google;

        // validate the redirectUri.  This is a frequent cause of confusion.
        if (!KEYS.redirect_uris || KEYS.redirect_uris.length === 0) {
            throw new Error(INVALID_REDIRECT_URI);
        }
        const redirectUri = KEYS.redirect_uris[KEYS.redirect_uris.length - 1];
        const parts = new url.URL(redirectUri);
        if (
            redirectUri.length === 0 ||
            parts.port !== '3000' ||
            parts.hostname !== 'localhost' ||
            parts.pathname !== '/oauth2callback'
        ) {
            throw new Error(INVALID_REDIRECT_URI);
        }

        // create an oAuth client to authorize the API call
        console.log('GOOGLE: ', typeof this.google);
        this.oAuth2Client = new this.google.auth.OAuth2(
            KEYS.client_id,
            KEYS.client_secret,
            redirectUri
        );
    }

    // Open an http server to accept the oauth callback. In this
    // simple example, the only request to our webserver is to
    // /oauth2callback?code=<code>
    async authenticate(scopes) {
        console.log('Got here! 1');
        return new Promise((resolve, reject) => {
            // grab the url that will be used for authorization
            this.authorizeUrl = this.oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: scopes.join(' '),
            });
            console.log('Got here! 1.1');
            const server = http.createServer(async (req, res) => {
                    console.log('got here - 2.0')
                    try {
                        if (req.url.indexOf('/oauth2callback') > -1) {
                            const qs = new url.URL(req.url, 'http://localhost:3000')
                                .searchParams;
                            res.end(
                                'Authentication successful! Please return to the console.'
                            );
                            server.destroy();
                            const {
                                tokens
                            } = await this.oAuth2Client.getToken(qs.get('code'));
                            console.log('got here - 2.1')
                            this.oAuth2Client.credentials = tokens;
                            resolve(this.oAuth2Client);
                        }
                    } catch (e) {
                        reject(e);
                    }
                })
                .listen(3000, () => {
                    // open the browser to the authorize url to start the workflow
                    console.log('got here 2.2', this.authorizeUrl)
                    return open(this.authorizeUrl, {
                        wait: false
                    }).then(cp => {
                        console.log('got here 2.3')
                        return cp.unref();
                    });
                });
            console.log('the server', server);
            console.log('the server type', typeof server);
            destroyer(server);
        });
    }
}