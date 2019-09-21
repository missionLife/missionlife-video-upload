


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
    }

    async authenticate() {
        const server = new Lien({
            host: 'localhost', 
            port: 3000
        });
        
        server.addPage("/oauth2callback", lien => {
            console.log("Trying to get the token using the following code: " + lien.query.code);
            this.oAuth2Client.getToken(lien.query.code, (err, tokens) => {
         
                if (err) {
                    lien.lien(err, 400);
                    return console.log(err);
                }
         
                console.log("Got the tokens.");
         
                this.oAuth2Client.setCredentials(tokens);
         
                lien.end("The video is being uploaded. Check out the logs in the terminal.");
            });
        });        
    }
    
}