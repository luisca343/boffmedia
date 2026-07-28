import { Injectable } from '@nestjs/common';
import {
  CategoryActivity,
  CategoryCount,
  ForumCategoriesRepository,
} from '../repositories/forum-categories.repository';
import { ForumCategory as ForumCategoryRow } from '@/_db/schema/BoffMediaForum';
import { ForumCategory } from '../entities/forum-category.entity';
import { toForumAuthor } from '../forum.mapper';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: ForumCategoriesRepository) {}

  async getCategories(): Promise<ForumCategory[]> {
    const categories = await this.repo.findAll();
    if (categories.length === 0) return [];

    const ids = categories.map((c) => c.id);
    const [threadCounts, postCounts, activity] = await Promise.all([
      this.repo.threadCounts(ids),
      this.repo.postCounts(ids),
      this.repo.latestActivity(ids),
    ]);

    return categories.map((c) =>
      this.mapCategory(c, threadCounts, postCounts, activity),
    );
  }

  async getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
    const category = await this.repo.findBySlug(slug);
    if (!category) return null;

    const ids = [category.id];
    const [threadCounts, postCounts, activity] = await Promise.all([
      this.repo.threadCounts(ids),
      this.repo.postCounts(ids),
      this.repo.latestActivity(ids),
    ]);

    return this.mapCategory(category, threadCounts, postCounts, activity);
  }

  // Raw row (with id) for callers that only need to resolve slug → category id.
  async findBySlug(slug: string): Promise<ForumCategoryRow | null> {
    return this.repo.findBySlug(slug);
  }

  // Raw row (with locked) for the create-thread write path.
  async findById(id: number): Promise<ForumCategoryRow | null> {
    return this.repo.findById(id);
  }

  private mapCategory(
    row: ForumCategoryRow,
    threadCounts: CategoryCount[],
    postCounts: CategoryCount[],
    activity: CategoryActivity[],
  ): ForumCategory {
    const threads = threadCounts.find((t) => t.categoryId === row.id)?.count;
    const posts = postCounts.find((p) => p.categoryId === row.id)?.count;
    // activity is ordered newest-first, so the first match is the latest.
    const act = activity.find((a) => a.categoryId === row.id) ?? null;
    const lastAuthor =
      act && act.userId != null && act.username != null
        ? toForumAuthor({
            id: act.userId,
            username: act.username,
            profilePicture: act.picture,
          })
        : null;

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      icon: row.icon,
      hue: row.hue,
      locked: row.locked,
      threads: Number(threads ?? 0),
      posts: Number(posts ?? 0),
      lastAuthor,
      lastAt: act ? act.lastAt : null,
    };
  }
}
