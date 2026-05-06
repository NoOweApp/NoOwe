function splitBill(items) {
    const result = {};

    for (const item of items) {
        const { name, cost, owners } = item;

        if (!owners || owners.length === 0)
            continue;

        const costInCents = Math.round(cost * 100);
        const splitInCents = Math.floor(costInCents / owners.length);
        let remainder = costInCents % owners.length;

        for (const owner of owners) {
            if (!result[owner.phone]) {
                result[owner.phone] = {
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

            result[owner.phone].items.push({
                name: name,
                percentage: 1 / owners.length,
                cost: finalCost
            });

            result[owner.phone].cost = Math.round((result[owner.phone].cost + finalCost) * 100) / 100;
        }
    }

    return Object.values(result);
    // {
    //     owner: string "phone number", 
    //     cost: number "total costs for them",
    //     [ ITEMS
    //         name: string "item_name",
    //         percentage: number "percentage assigned to them"
    //         cost: amount assigned to them
    //     ]
    // }
}

function splitTax(result, expenses) {
    // result = {
    //     owner: string "phone number", 
    //     cost: number "total costs for them",
    //     [ ITEMS
    //         name: string "item_name",
    //         percentage: number "percentage assigned to them"
    //         cost: amount assigned to them
    //     ]
    // }
    // expenses: number
    let totalCost = 0;
    for (const person of result) {
        totalCost += person.cost;
    }

    const expensesInCents = Math.round(expenses * 100);
    const totalCostInCents = Math.round(totalCost * 100);

    let remainderCents = expensesInCents;

    for (const person of result) {
        const share = totalCostInCents > 0
            ? Math.floor((person.cost / totalCost) * expensesInCents)
            : 0;
        person.tax = share;
        remainderCents -= share;
    }

    for (let i = 0; i < remainderCents; i++) {
        result[i].tax += 1;
    }

    for (const person of result) {
        person.tax = person.tax / 100;
    }

    // result = {
    //     owner: string "phone number", 
    //     cost: number "total costs for them",
    //     tax: number
    //     [ ITEMS
    //         name: string "item_name",
    //         percentage: number "percentage assigned to them"
    //         cost: amount assigned to them
    //     ]
    // }
    return result;
}

export { splitBill, splitTax };

