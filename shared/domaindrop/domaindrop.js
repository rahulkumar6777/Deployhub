export const domainDrop = async ({ DomainDrop, apiKey }) => {
    const drop = new DomainDrop({
        apiKey
    });
    return drop;
}