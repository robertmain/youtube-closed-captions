import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { EOL } from 'os';
import { format, differenceInHours, differenceInMinutes, differenceInSeconds, addSeconds, parse } from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd\'T\'HH:mm.ss.SSS\'Z\'';

export class Client {
    private url: string;
    private captionAPI: AxiosInstance;
    private seqCounter: number = 0;
    private lastDate: Date;

    public constructor(url: string) {
        this.url = url;
        this.captionAPI = axios.create({
            validateStatus: (status) => status < 400,
            headers: {
                'encoding': 'text/plain',
            },
        });
    }

    /**
     * Send caption text to the YouTube caption API
     *
     * @param caption Caption text
     * @param date The timestamp to link the caption text to
     */
    public async send(caption: string, date: Date = new Date()): Promise<AxiosResponse> {
        let offsetDate = date;
        if(this.lastDate) {
            const dateDiff = differenceInSeconds(date, this.lastDate);
            offsetDate = addSeconds(offsetDate, dateDiff);
        }
        const timestamp = format(offsetDate, 'yyyy-MM-dd\'T\'HH:mm.ss.SSS\'Z\'');
        return this.makeRequest(timestamp + EOL + caption);
    }

    /**
     * Make request to caption API
     * @param postBody Any data to include in the POST body to the caption API.
     * @param sequence A number used for ordering captions. Note that once
     */
    private async makeRequest(postBody: string = ''): Promise<AxiosResponse> {
        try {
            const response = await this.captionAPI.post(this.url, postBody, {
                params: {
                    seq: this.seqCounter,
                },
            });
            if(!this.lastDate){
                this.lastDate = parse(response.data, DATE_FORMAT, new Date());
            }
            this.seqCounter += 1;
            return response;
        } catch (e) {
            this.makeRequest(postBody);
        }
    }
}
