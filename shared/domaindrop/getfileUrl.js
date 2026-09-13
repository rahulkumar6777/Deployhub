export const getFileUrlDomainDrop = async ({ domainDrop, fileId, DomainDropError }) => {
    try {
        await domainDrop.files.getUrl(fileId, { expiresIn: 9000 })
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