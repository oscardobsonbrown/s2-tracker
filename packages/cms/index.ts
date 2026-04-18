import {
  basehub as basehubClient,
  fragmentOn as basehubFragmentOn,
} from "basehub";
import { keys } from "./keys";
import "./basehub.config";

// Re-export RichTextNode for use in consuming packages
export type { RichTextNode } from "basehub/react-rich-text";

// Workaround for basehub v9.5.3 broken type signature - runtime works fine
type FragmentResult = Record<string, unknown>;
type FragmentOn = (typeName: string, selection: object) => FragmentResult;
const fragmentOn: FragmentOn = basehubFragmentOn as unknown as FragmentOn;

const basehub = basehubClient({
  token: keys().BASEHUB_TOKEN,
});

/* -------------------------------------------------------------------------------------------------
 * Explicit Type Definitions (workaround for basehub v9.5.3 type inference bug)
 * -----------------------------------------------------------------------------------------------*/

interface ImageFragment {
  alt: string;
  blurDataURL: string;
  height: number;
  url: string;
  width: number;
}

interface PostMeta {
  _slug: string;
  _title: string;
  authors: {
    _title: string;
    avatar: ImageFragment;
    xUrl: string;
  };
  categories: {
    _title: string;
  };
  date: string;
  description: string;
  image: ImageFragment;
}

interface PostBody {
  json: {
    content: unknown;
    toc: unknown;
  };
  plainText: string;
  readingTime: number;
}

type Post = PostMeta & {
  body: PostBody;
};

interface LegalPostMeta {
  _slug: string;
  _title: string;
  description: string;
}

type LegalPost = LegalPostMeta & {
  body: PostBody;
};

export type { LegalPost, LegalPostMeta, Post, PostMeta };

/* -------------------------------------------------------------------------------------------------
 * Common Fragments
 * -----------------------------------------------------------------------------------------------*/

const imageFragment = fragmentOn("BlockImage", {
  url: true,
  width: true,
  height: true,
  alt: true,
  blurDataURL: true,
});

/* -------------------------------------------------------------------------------------------------
 * Blog Fragments & Queries
 * -----------------------------------------------------------------------------------------------*/

const postMetaFragment = fragmentOn("PostsItem", {
  _slug: true,
  _title: true,
  authors: {
    _title: true,
    avatar: imageFragment,
    xUrl: true,
  },
  categories: {
    _title: true,
  },
  date: true,
  description: true,
  image: imageFragment,
});

const postFragment = fragmentOn("PostsItem", {
  ...postMetaFragment,
  body: {
    plainText: true,
    json: {
      content: true,
      toc: true,
    },
    readingTime: true,
  },
});

export const blog = {
  postsQuery: fragmentOn("Query", {
    blog: {
      posts: {
        items: postMetaFragment,
      },
    },
  }),

  latestPostQuery: fragmentOn("Query", {
    blog: {
      posts: {
        __args: {
          orderBy: "_sys_createdAt__DESC",
        },
        item: postFragment,
      },
    },
  }),

  postQuery: (slug: string) =>
    fragmentOn("Query", {
      blog: {
        posts: {
          __args: {
            filter: {
              _sys_slug: { eq: slug },
            },
          },
          item: postFragment,
        },
      },
    }),

  getPosts: async (): Promise<PostMeta[]> => {
    const data = await basehub.query(blog.postsQuery);

    return (data as unknown as { blog: { posts: { items: unknown } } }).blog
      .posts.items as unknown as PostMeta[];
  },

  getLatestPost: async (): Promise<Post | null> => {
    const data = await basehub.query(blog.latestPostQuery);

    return (data as unknown as { blog: { posts: { item: unknown } } }).blog
      .posts.item as unknown as Post | null;
  },

  getPost: async (slug: string): Promise<Post | null> => {
    const query = blog.postQuery(slug);
    const data = await basehub.query(query);

    return (data as unknown as { blog: { posts: { item: unknown } } }).blog
      .posts.item as unknown as Post | null;
  },
};

/* -------------------------------------------------------------------------------------------------
 * Legal Fragments & Queries
 * -----------------------------------------------------------------------------------------------*/

const legalPostMetaFragment = fragmentOn("LegalPagesItem", {
  _slug: true,
  _title: true,
  description: true,
});

const legalPostFragment = fragmentOn("LegalPagesItem", {
  ...legalPostMetaFragment,
  body: {
    plainText: true,
    json: {
      content: true,
      toc: true,
    },
    readingTime: true,
  },
});

export const legal = {
  postsQuery: fragmentOn("Query", {
    legalPages: {
      items: legalPostFragment,
    },
  }),

  latestPostQuery: fragmentOn("Query", {
    legalPages: {
      __args: {
        orderBy: "_sys_createdAt__DESC",
      },
      item: legalPostFragment,
    },
  }),

  postQuery: (slug: string) =>
    fragmentOn("Query", {
      legalPages: {
        __args: {
          filter: {
            _sys_slug: { eq: slug },
          },
        },
        item: legalPostFragment,
      },
    }),

  getPosts: async (): Promise<LegalPost[]> => {
    const data = await basehub.query(legal.postsQuery);

    return (data as unknown as { legalPages: { items: unknown } }).legalPages
      .items as unknown as LegalPost[];
  },

  getLatestPost: async (): Promise<LegalPost | null> => {
    const data = await basehub.query(legal.latestPostQuery);

    return (data as unknown as { legalPages: { item: unknown } }).legalPages
      .item as unknown as LegalPost | null;
  },

  getPost: async (slug: string): Promise<LegalPost | null> => {
    const query = legal.postQuery(slug);
    const data = await basehub.query(query);

    return (data as unknown as { legalPages: { item: unknown } }).legalPages
      .item as unknown as LegalPost | null;
  },
};
