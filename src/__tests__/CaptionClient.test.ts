import { Client } from '../YouTubeCaptionClient';
import mockAxios from 'jest-mock-axios';

describe('Caption Client', () => {
    let client: Client;

    beforeEach(() => {
        client = new Client('youtube.com/my-page');
    });

    afterEach(() => {
        mockAxios.reset();
    })

    describe('send', (): void => {
        it('connects to the URL provided in the constructor', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({});

            await client.send('');

            expect(mockAxios.post).toHaveBeenCalled();
            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.stringMatching(/youtube.com\/my-page/),
                expect.anything()
            );
        });
        it('sends caption text to the API', async (): Promise<void> => {
            mockAxios.post.mockResolvedValue({});

            await client.send('Hello world');

            expect(mockAxios.post).toHaveBeenCalled();
            expect(mockAxios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringMatching(/Hello world/)
            );
        });
        it('calculates the current timestamp and includes it with captions', async (): Promise<void> => {
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
    });
});
