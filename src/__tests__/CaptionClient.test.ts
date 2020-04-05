import { Client, DATE_FORMAT } from '../YouTubeCaptionClient';
import mockAxios from 'jest-mock-axios';
import { EOL } from 'os';
import { format, isValid, parseISO, parse, differenceInSeconds, differenceInMinutes, addHours } from 'date-fns';
import { AxiosError, AxiosResponse } from 'axios';

const now = new Date();
const youtubeTime = new Date(Date.UTC(2020, 4, 4, 22, 39, 55, 152));

describe('Caption Client', () => {
    let client: Client;

    beforeEach(() => {
        mockAxios.create.mockImplementation(() => mockAxios)
        client = new Client('youtube.com/my-page');
    });

    afterEach(() => {
        mockAxios.reset();
    })

    describe('caption sequencing', (): void => {
        it('adds caption counter to every caption', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({});

            await client.send('hello world');

            expect(mockAxios.post).toHaveBeenCalled();
            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    params: {
                        seq: 0,
                    },
                }),
            );
        });
        it('increments the caption sequence counter for every caption', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({
                data: format(youtubeTime, DATE_FORMAT),
            } as AxiosResponse);

            await client.send('hello world');
            await client.send('testing 123');

            expect(mockAxios.post).toHaveBeenCalledTimes(2);
            expect(mockAxios.post).toHaveBeenNthCalledWith(1,
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    params: {
                        seq: 0,
                    },
                }),
            );
            expect(mockAxios.post).toHaveBeenNthCalledWith(2,
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    params: {
                        seq: 1,
                    },
                }),
            );
        });
        it('uses the server provided time to offset the caption clock', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({
                data: format(youtubeTime, DATE_FORMAT),
            } as AxiosResponse);

            const youTubeDifference = differenceInSeconds(youtubeTime, now);

            await client.send('Hello world', now);
            await client.send('More text', now);

            const [, [, captionText]] = mockAxios.post.mock.calls;
            const parsedRequestTime = parse(captionText.split(EOL)[0], DATE_FORMAT, now);
            const requestDifference = differenceInSeconds(now, parsedRequestTime);

            expect(youTubeDifference).toEqual(requestDifference);
        });
        it('only sets the server offset once', async (): Promise<void> => {
            mockAxios.post.mockResolvedValueOnce({
                data: format(youtubeTime, DATE_FORMAT),
            } as AxiosResponse);
            await client.send('Hello world', now);

            mockAxios.post.mockResolvedValueOnce({
                data: format(addHours(youtubeTime, 4), DATE_FORMAT),
            } as AxiosResponse);
            await client.send('More text', now);

            mockAxios.post.mockResolvedValueOnce({
                data: format(addHours(youtubeTime, 2), DATE_FORMAT),
            } as AxiosResponse);
            await client.send('Even more text', now);

            const dates = mockAxios.post.mock.calls.slice(1)
                .map(([, postBody]) => postBody.split(EOL)[0]);

            expect(dates).toHaveLength(2);
            expect(dates).toEqual(Array(2).fill(dates[0]));
        });
    });
    describe('caption transport', (): void => {
        it('connects to the URL provided in the constructor', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({});

            await client.send('');

            expect(mockAxios.post).toHaveBeenCalled();
            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.stringMatching(/youtube.com\/my-page/),
                expect.anything(),
                expect.anything()
            );
        });
        it('sends caption text', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({});

            await client.send('Hello world');

            expect(mockAxios.post).toHaveBeenCalled();
            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringMatching(/Hello world/),
                expect.anything()
            );
        });
        it('encodes the request as text/plain', async () : Promise<void> => {
            expect(mockAxios.create).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    headers: {
                        encoding: 'text/plain',
                    },
                })
            );
        });
        it('retries requests that time out', async (): Promise<void> => {
            mockAxios.post.mockRejectedValueOnce({
                code: 'ECONNABORTED',
                isAxiosError: true,
            } as AxiosError);

            await client.send('testing testing 1234');
            expect(mockAxios.post).toBeCalledTimes(2);
            expect(mockAxios.post).toHaveBeenNthCalledWith(1,
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    params: {
                        seq: 0,
                    },
                }),
            );
            expect(mockAxios.post).toHaveBeenNthCalledWith(2,
                expect.anything(),
                expect.anything(),
                expect.objectContaining({
                    params: {
                        seq: 0,
                    },
                }),
            );
        });
        it('returns the axios response from the server', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({
                data: {}
            });

            const response = await client.send('testing testing 1234');
            expect(response).toBeTruthy();
            expect(response).toHaveProperty('data');
        });
    });
    describe('caption formatting', (): void => {
        describe('timestamp', (): void => {
            it('is on the first line', async (): Promise<void> => {
                const timestamp = new Date();
                await client.send('hello world', timestamp);

                const [[, captionText]] = mockAxios.post.mock.calls;

                const [date] = captionText.split(EOL);

                expect(date).toBeTruthy();
                expect(isValid(parseISO(date))).toBe(true);
            });
            it('generates a timetamp if not supplied', async (): Promise<void> => {
                await client.send('Hello world');

                expect(mockAxios.post).toHaveBeenCalled();
                expect(mockAxios.post).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.stringContaining(format(new Date(), 'yyyy-MM-dd')),
                    expect.anything()
                );
            });
            it('uses the provided timestamp if one is supplied', async () => {
                const fakeDate = new Date();

                await client.send('Hello world', fakeDate);

                expect(mockAxios.post).toHaveBeenCalled();
                expect(mockAxios.post).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.stringMatching(format(fakeDate, DATE_FORMAT)),
                    expect.anything()
                );
            });
            it('is in yyyy-MM-ddTHH:mm.ss.SSSZ format', async (): Promise<void> => {
                const dateObject = new Date();
                await client.send('hello world', dateObject);

                const [[, captionText]] = mockAxios.post.mock.calls;

                const [timestamp] = captionText.split(EOL);
                const [date, time] = timestamp.split('T');

                expect(date).toMatch(/^[0-9]{4}\-[0-9]{2}-[0-9]{2}$/);
                expect(time).toMatch(/^[0-9]{2}\:[0-9]{2}\.[0-9]{2}.[0-9]{3}\Z$/);
            });
        });
        describe('text', (): void => {
            it('it is on the second line beneath the timestamp', async (): Promise<void> => {
                await client.send('hello world');

                const [[, caption]] = mockAxios.post.mock.calls;

                const [, captionText] = caption.split(EOL);

                expect(captionText).toBeTruthy();
                expect(captionText).toBe('hello world');
            });
            it('can include line breaks', async (): Promise<void> => {
                await client.send('hello<br />world<br>');

                const [[, caption]] = mockAxios.post.mock.calls;

                const [, captionText] = caption.split(EOL);

                expect(captionText).toContain('<br />');
                expect(captionText).toContain('<br>');
            });
        });
    });
});
