import axios, { AxiosInstance } from 'axios';

export class Client {
    private url: string;
    private captionAPI: AxiosInstance;

    public constructor(url: string) {
        this.url = url
        this.captionAPI = axios.create({
        });
    }

    public async send(caption: string, date: Date = new Date()): Promise<void> {
        const timestamp = date.toISOString();
        await this.captionAPI.post(this.url, caption + ' ' + timestamp);
    }
}
