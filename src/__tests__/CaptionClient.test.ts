import { Client } from '../YouTubeCaptionClient';
import mockAxios from 'jest-mock-axios';
import { EOL } from 'os';
import { format, isValid, parseISO } from 'date-fns';
import { parseFromTimeZone } from 'date-fns-timezone';

describe('Caption Client', () => {
    let client: Client;

    beforeEach(() => {
        mockAxios.create.mockImplementation(() => mockAxios)
        client = new Client('youtube.com/my-page');
    });

    afterEach(() => {
        mockAxios.reset();
    })

    describe('caption transport', (): void => {
        it('connects to the URL provided in the constructor', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({});

            await client.send('');

            expect(mockAxios.post).toHaveBeenCalled();
            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.stringMatching(/youtube.com\/my-page/),
                expect.anything()
            );
        });
        it('sends caption text', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({});

            await client.send('Hello world');

            expect(mockAxios.post).toHaveBeenCalled();
            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringMatching(/Hello world/)
            );
        });
        it('uses the current timetamp if not supplied', async (): Promise<void> => {
            const fakeDateString = new Date().toISOString();
            jest.spyOn(global.Date.prototype, 'toISOString')
                .mockImplementation(() => fakeDateString);

            await client.send('Hello world');

            expect(mockAxios.post).toHaveBeenCalled();
            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringMatching(fakeDateString)
            );
        });
        it('uses the provided timestamp if one is supplied', async () => {
            const fakeDate = new Date();
            const fakeDateString = fakeDate.toISOString();
            jest.spyOn(global.Date.prototype, 'toISOString')
                .mockImplementation(() => fakeDateString);

            await client.send('Hello world', fakeDate);

            expect(mockAxios.post).toHaveBeenCalled();
            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringMatching(fakeDateString)
            );
        });
        it('encodes the request as text/plain', async () => {
            expect(mockAxios.create).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    headers: {
                        encoding: 'text/plain',
                    },
                })
            );
        });
    });
    describe('caption formatting', () => {
        describe('date', () => {
            it('is on the first line', async (): Promise<void> => {
                const timestamp = new Date();
                await client.send('hello world', timestamp);

                const [[, captionText]] = mockAxios.post.mock.calls;

                const [date] = captionText.split(EOL);

                expect(date).toBeTruthy();
                expect(isValid(parseISO(date))).toBe(true);
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
        })
    });
});
