function splitBill(items, extras) { // TODO: Splitting cents between people
    const result = {};
    // [owner]: string "phone number", {
    //     cost: number "total costs for them",
    //     [ ITEMS
    //         name: string "item_name",
    //         percentage: number "percentage assigned to them"
    //         cost: amount assigned to them
    //     ]
    // }

    for (const item of items) {
        const { name, cost, owners } = item;

        if (!owners || owners.length === 0)
            continue;

        const costInCents = Math.round(cost * 100);
        const splitInCents = Math.floor(costInCents / owners.length);
        let remainder = costInCents % owners.length;

        for (const owner of owners) {
            if (!result[owner]) {
                result[owner] = {
                    owner: owner,
                    cost: 0,
                    items: []
                };
            }

            let finalCents = splitInCents;

            if (remainder > 0) {
                finalCents += 1;
                remainder -= 1;
            }

            const finalCost = finalCents / 100;

            result[owner].items.push({
                name: name,
                percentage: 1 / owners.length,
                cost: finalCost
            });

            result[owner].cost = Math.round((result[owner].cost + finalCost) * 100) / 100;
        }
    }

    return Object.values(result);
    // {
    //      owner: string "phone number", 
    //     cost: number "total costs for them",
    //     [ ITEMS
    //         name: string "item_name",
    //         percentage: number "percentage assigned to them"
    //         // maybe add tax? as another item
    //     ]
    // }
}

export { splitBill };
