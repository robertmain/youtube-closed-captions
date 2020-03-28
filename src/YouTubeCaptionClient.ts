import axios, { AxiosInstance } from 'axios';

export class Client {
    private url: string;
    private captionAPI: AxiosInstance;

    public constructor(url: string) {
        this.url = url
        this.captionAPI = axios.create({
        });
    }

    public async send(caption: string): Promise<void> {
        await this.captionAPI.post(this.url, caption);
    }
}
