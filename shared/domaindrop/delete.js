export const deleteFromDomainDrop = async ({ domainDrop, filename, DomainDropError }) => {
    try {
        const res = await domainDrop.files.delete(filename);
        console.log(res)
        return res;
    } catch (error) {
        if (error instanceof DomainDropError) {
            console.log({
                name: error.name,
                message: error.message,
                status: error.status,
                payload: error.payload,
            })
        }
    }
}