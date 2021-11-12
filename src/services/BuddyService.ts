import { BuddyStatus } from "../types/BuddyStatus";
import { prisma } from "../index";

export const getBuddyStatus = async (userId: number, partnerId: number | null): Promise<BuddyStatus> => {
    const isUserConnected = await prisma.user.findFirst({
        where: {
            partner1Id: userId,
        }
    });
    if (!partnerId) {
        return !isUserConnected ? Promise.resolve(BuddyStatus.INACTIVE) : Promise.resolve(BuddyStatus.INVITED)
    } else {
        return !isUserConnected ? Promise.resolve(BuddyStatus.AWAITING_CONFIRMATION) : Promise.resolve(BuddyStatus.CONNECTED)
    }
}
