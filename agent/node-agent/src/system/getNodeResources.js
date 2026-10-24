import si from "systeminformation";

export const getNodeResources = async () => {
    const [cpu, mem, load, disks] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.currentLoad(),
        si.fsSize(),
    ]);

    const totalMemory = mem.total;
    const freeMemory = mem.available;

    const cpuUsagePercent = load.currentLoad;

    const totalDisk = disks.reduce(
        (sum, disk) => sum + disk.size, 0
    );

    const freeDisk = disks.reduce(
        (sum, disk) => sum + disk.available, 0
    );

    return {
        cpu: {
            cores: cpu.cores,
            usagePercent: Number(cpuUsagePercent.toFixed(2)),
            loadAverage: si.processes
                ? undefined
                : undefined,
        },
        memory: {
            totalBytes: totalMemory,
            freeBytes: freeMemory,
            usedBytes: totalMemory - mem.free,
            availableBytes: freeMemory,
        },
        disk: {
            totalBytes: totalDisk,
            freeBytes: freeDisk,
            usedBytes: totalDisk - freeDisk,
        },
    };
};