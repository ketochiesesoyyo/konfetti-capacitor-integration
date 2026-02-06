import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
	const now = new Date();
	const posts = (await getCollection('blog', ({ data }) => !data.draft && data.pubDate <= now))
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	return rss({
		title: 'Blog Konfetti',
		description: 'Consejos para socializar en bodas, tendencias en celebraciones y todo sobre conocer gente nueva en el evento mas especial del ano.',
		site: context.site!,
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: `/${post.id}/`,
		})),
	});
}
