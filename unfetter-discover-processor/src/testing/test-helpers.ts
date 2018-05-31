export default class TestHelpers {

    /**
     * @param  {any[]} arr
     * @description Safely copies all objects in an array
     */
    public static safeObjectArrayCopy(arr: any[]) {
        return arr.map((arrEl) => {
            if (typeof arrEl === 'object') {
                return {
                    ...arrEl
                };
            }
            return arrEl;
        });
    }
}
