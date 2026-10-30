import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getFilteredGames,
    getGameById,
} from './games';

interface FilterFixtureIds {
    strategyCategoryId: number;
    puzzleCategoryId: number;
    publisherOneId: number;
    publisherTwoId: number;
}

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

async function seedFilterGames(db: Database): Promise<FilterFixtureIds> {
    const [strategy] = await db
        .insert(categories)
        .values({ name: 'Strategy' })
        .returning({ id: categories.id });
    const [puzzle] = await db
        .insert(categories)
        .values({ name: 'Puzzle' })
        .returning({ id: categories.id });
    const [publisherOne] = await db
        .insert(publishers)
        .values({ name: 'Pub One' })
        .returning({ id: publishers.id });
    const [publisherTwo] = await db
        .insert(publishers)
        .values({ name: 'Pub Two' })
        .returning({ id: publishers.id });

    await db.insert(games).values([
        {
            title: 'Game A',
            description: 'Strategy game from publisher one',
            categoryId: strategy.id,
            publisherId: publisherOne.id,
        },
        {
            title: 'Game B',
            description: 'Puzzle game from publisher one',
            categoryId: puzzle.id,
            publisherId: publisherOne.id,
        },
        {
            title: 'Game C',
            description: 'Strategy game from publisher two',
            categoryId: strategy.id,
            publisherId: publisherTwo.id,
        },
        {
            title: 'Game D',
            description: 'Puzzle game from publisher two',
            categoryId: puzzle.id,
            publisherId: publisherTwo.id,
        },
    ]);

    return {
        strategyCategoryId: strategy.id,
        puzzleCategoryId: puzzle.id,
        publisherOneId: publisherOne.id,
        publisherTwoId: publisherTwo.id,
    };
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('filters by a single category', async () => {
        const fixture = await seedFilterGames(db);

        const filtered = await getFilteredGames(db, {
            categoryIds: [fixture.strategyCategoryId],
        });

        expect(filtered.map((game) => game.title)).toEqual(['Game A', 'Game C']);
    });

    it('filters by one or more categories using OR semantics', async () => {
        const fixture = await seedFilterGames(db);

        const filtered = await getFilteredGames(db, {
            categoryIds: [fixture.strategyCategoryId, fixture.puzzleCategoryId],
        });

        expect(filtered.map((game) => game.title)).toEqual([
            'Game A',
            'Game B',
            'Game C',
            'Game D',
        ]);
    });

    it('filters by publisher', async () => {
        const fixture = await seedFilterGames(db);

        const filtered = await getFilteredGames(db, {
            publisherId: fixture.publisherTwoId,
        });

        expect(filtered.map((game) => game.title)).toEqual(['Game C', 'Game D']);
    });

    it('combines category and publisher filters using AND semantics', async () => {
        const fixture = await seedFilterGames(db);

        const filtered = await getFilteredGames(db, {
            categoryIds: [fixture.strategyCategoryId, fixture.puzzleCategoryId],
            publisherId: fixture.publisherOneId,
        });

        expect(filtered.map((game) => game.title)).toEqual(['Game A', 'Game B']);
    });

    it('returns all games when no filters are selected', async () => {
        await seedGames(db, 2);

        const filtered = await getFilteredGames(db, {});

        expect(filtered.map((game) => game.title)).toEqual(['Game 01', 'Game 02']);
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});
