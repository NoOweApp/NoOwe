function parseBill(imgList) {
    // imgList is an array of images taken by the camera/added from camera roll
    // each img has a uri, width and height (uri is temporary path to photo, lives on your phone but is deleted when the app closes)
    for (const img of imgList) {
        console.log(`Image uri: ${img.uri}`);
    }


    // example bill
    return {
        receipt_id: "D8F72EFHR375D",
        receipt_date: "2026-02-26",
        receipt_items: [
            {
            item_name: "hot dog",
            item_cost: 14.99,
            },
            {
            item_name: "water",
            item_cost: 2.99,
            },
            {
            item_name: "hot dog",
            item_cost: 14.99,
            },
            {
            item_name: "burger",
            item_cost: 23.99,
            }
        ],
        Tax: 0.0,
        tip: 0.0
    }
};

export { parseBill };
