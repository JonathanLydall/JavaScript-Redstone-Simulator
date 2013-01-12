        var thisMetadata = world.getBlockMetadata(posX, posY, posZ);
        var isTopHalf = (thisMetadata & 8) != 0;
        int bottomHalfMetadata;
        int topHalfMetadata;

        if (isTopHalf)
        {
            bottomHalfMetadata = world.getBlockMetadata(posX, posY - 1, posZ);
            topHalfMetadata = thisMetadata;
        }
        else
        {
            bottomHalfMetadata = thisMetadata;
            topHalfMetadata = world.getBlockMetadata(posX, posY + 1, posZ);
        }

        boolean hingeIsOnLeft = (topHalfMetadata & 1) != 0;
        var returnData = bottomHalfMetadata & 7 | (isTopHalf ? 8 : 0) | (hingeIsOnLeft ? 0x10 : 0);
        return returnData;
