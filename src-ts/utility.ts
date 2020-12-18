/**
 * Wraps response with Promise
 */
export function stringPromise(response: string): Promise<string> {
    return new Promise((resolve: (value: string) => void) => {
        resolve(response)
    }) 
}