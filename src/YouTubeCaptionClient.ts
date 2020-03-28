import axios, { AxiosInstance } from 'axios';
import { EOL } from 'os';
import { format } from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd\'T\'HH:mm.ss.SSS\'Z\'';

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
        const timestamp = format(date, 'yyyy-MM-dd\'T\'HH:mm.ss.SSS\'Z\'');
        await this.captionAPI.post(
            this.url,
            timestamp + EOL
            + caption
        );
    }
}
