import { Client } from '../YouTubeCaptionClient';
import mockAxios from 'jest-mock-axios';

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
    });
});
