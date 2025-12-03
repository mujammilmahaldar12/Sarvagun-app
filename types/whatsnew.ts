export interface WhatsNewTag {
    id: number;
    name: string;
}

export type WhatsNewType = 'update' | 'news' | 'policy';
export type WhatsNewStatus = 'draft' | 'published' | 'archived';

export interface WhatsNew {
    id: number;
    title: string;
    short_description: string;
    description: string;
    type: WhatsNewType;
    tags: WhatsNewTag[];
    file: string | null;
    created_at: string;
    updated_at: string;
    status: WhatsNewStatus;
    publish_at: string | null;
    announcement: boolean;
    author: number | null;
    author_name: string;
    likes_count: number;
    dislikes_count: number;
    views_count: number;
    user_reaction: 'like' | 'dislike' | null;
}

export interface WhatsNewLike {
    status: 'created' | 'updated' | 'removed';
    reaction: 'like' | 'dislike' | null;
}
