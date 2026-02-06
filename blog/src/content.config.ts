import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			category: z.enum(['invitados', 'parejas', 'wedding-planners', 'tendencias', 'historias']),
			tags: z.array(z.string()),
			author: z.string(),
			draft: z.boolean().optional(),
		}),
});

export const collections = { blog };
