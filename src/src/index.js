const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    '495680661684-q8rfi6p1e3l9smnqlhsmf6sdvmh01l48.apps.googleusercontent.com',
    'jl6NBWKs4XjANxJN65T9YSLw',
    'http://localhost:8080'
);

oauth2Client.setCredentials({
    refresh_token: `1/G_lniDMwtZdDpOBExOcCOIxF1QAfOWvcqKSDRX_uanY`
});


const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
});

youtube.playlists.list({ part: '', mine: true });