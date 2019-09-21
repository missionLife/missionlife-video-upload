import url from 'url';
import http from 'http';
const open = require('open');
const destroyer = require('server-destroy');

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

const GOOGLE_AUTH_CLIENT_SCOPE = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
];
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
        console.log('the redirect uri', redirectUri);
        // create an oAuth client to authorize the API call
        this.oAuth2Client = new this.google.auth.OAuth2(
            KEYS.client_id,
            KEYS.client_secret,
            redirectUri
        );
        
        this.authorizeUrl = this.oAuth2Client.generateAuthUrl({
            'scope': GOOGLE_AUTH_CLIENT_SCOPE,
            'access_type':'offline',
            'approval_prompt':'force',
            'response_type':'code'
        });
        console.log('The Authorization URL or Code: ', this.authorizeUrl);
        const server = http
            .createServer(async (req, res) => {
                try {
                    if (req.url.indexOf('/oauth2callback') > -1) {
                    // acquire the code from the querystring, and close the web server.
                    const qs = new url.URL(req.url, 'http://localhost:3000')
                        .searchParams;
                    const code = qs.get('code');
                    console.log(`Code is ${code}`);
                    res.end('Authentication successful! Please return to the console.');
                    server.destroy();
        
                    // Now that we have the code, use that to acquire tokens.
                    const r = await oAuth2Client.getToken(code);
                    // Make sure to set the credentials on the OAuth2 client.
                    oAuth2Client.setCredentials(r.tokens);
                    console.info('Tokens acquired.');
                    resolve(oAuth2Client);
                    }
                } catch (e) {
                    reject(e);
                }
            })
            .listen(3000, () => {
                // open the browser to the authorize url to start the workflow
                console.log('The Authorization URL or Code: ', this.authorizeUrl);
                open(this.authorizeUrl, {wait: false}).then(cp => cp.unref());
            });
            console.log('destroying the server');
      destroyer(server);
    }
}