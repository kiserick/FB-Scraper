
// Interface which determines what postBlocks should be shown to the user at the present time.
// This takes into account ratios of different network post's aswell as interweaving the posts
// to create an even feel to the post-feed.
export class PostMasterGeneral {

    // Returns PostBlocks that should be sent to the NAPI
    //
    // @param   postBlocks - Array of postBlocks
    //
    // @return  Array of postBlocks
    shouldPostBlocks(postBlocks) {
        return postBlocks;
    }

}