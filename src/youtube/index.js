const fs = require('fs');
const readline = require('readline');

export default class Youtube {
    constructor({
        google
    }) {
        this.google = google;
        this.youtube = google.youtube({
            version: 'v3',
            auth: 'AIzaSyDDAytVCG1lLtt-EIOuSBLYSEd6y8W2uL4',
        });
    }

    async upload(videoData) {
        console.log('videoData - ', videoData);
        const videoFile = fs.writeFileSync('/tmp/temp.txt', videoData.Body);
        console.log('stored file');
        const fileSize = fs.statSync('/tmp/temp.txt').size;
        console.log('Video Size: ', fileSize);
        const res = await this.youtube.videos.insert({
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
    }
    async getChannels() {
        const myYoutube = this.youtube('v3');
        try {
            const response = await myYoutube.channels.list({
                auth: this.googleAuth.oAuth2Client,
                part: 'snippet,contentDetails,statistics',
                forUsername: 'admin'
            });
        } catch (error) {
            throw new Error(`There was error in the Youtube`)
        }

        var channels = response.data.items;
            if (channels.length == 0) {
                console.log('No channel found.');
            } else {
                console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
                    'it has %s views.',
                    channels[0].id,
                    channels[0].snippet.title,
                    channels[0].statistics.viewCount);
            }
    }

}