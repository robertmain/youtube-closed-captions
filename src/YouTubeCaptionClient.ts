import axios, { AxiosInstance } from 'axios';
import { EOL } from 'os';

export class Client {
    private url: string;
    private captionAPI: AxiosInstance;

    public constructor(url: string) {
        this.url = url
        this.captionAPI = axios.create({
            headers: {
                'encoding': 'text/plain',
            },
        });
    }

    public async send(caption: string, date: Date = new Date()): Promise<void> {
        const timestamp = date.toISOString();
        await this.captionAPI.post(
            this.url,
            timestamp + EOL
            + caption
        );
    }
}
