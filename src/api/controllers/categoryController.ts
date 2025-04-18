import { Request, Response } from "express";
import Session from "supertokens-node/recipe/session";
import { prisma } from "../../config/database";

export const categoryController = {
  // Get all categories for the authenticated user
  async getCategories(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();

      const categories = await prisma.category.findMany({
        where: { userId },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      });

      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return void res.status(500).json({ error: "Failed to fetch categories" });
    }
  },

  // Create a new category
  async createCategory(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();

      const { name, type } = req.body;

      // Validate request data
      if (!name || !type) {
        return void res
          .status(400)
          .json({ error: "Missing required category data" });
      }

      // Validate category type
      if (type !== "INCOME" && type !== "EXPENSE") {
        return void res
          .status(400)
          .json({ error: "Category type must be either INCOME or EXPENSE" });
      }

      // Check if category already exists
      const existingCategory = await prisma.category.findFirst({
        where: {
          userId,
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
      });

      if (existingCategory) {
        return void res
          .status(400)
          .json({ error: "A category with this name already exists" });
      }

      // Create category
      const category = await prisma.category.create({
        data: {
          userId,
          name,
          type,
        },
      });

      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      return void res.status(500).json({ error: "Failed to create category" });
    }
  },

  // Update an existing category
  async updateCategory(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();
      const { id } = req.params;

      // Check if category exists and belongs to user
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingCategory) {
        return void res.status(404).json({ error: "Category not found" });
      }

      const { name, type } = req.body;

      // Validate category type if provided
      if (type && type !== "INCOME" && type !== "EXPENSE") {
        return void res
          .status(400)
          .json({ error: "Category type must be either INCOME or EXPENSE" });
      }

      // Check for duplicate name
      if (name) {
        const duplicateCategory = await prisma.category.findFirst({
          where: {
            userId,
            name: {
              equals: name,
              mode: "insensitive",
            },
            id: {
              not: id,
            },
          },
        });

        if (duplicateCategory) {
          return void res
            .status(400)
            .json({ error: "A category with this name already exists" });
        }
      }

      // Update category
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          name,
          type,
        },
      });

      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      return void res.status(500).json({ error: "Failed to update category" });
    }
  },

  // Delete a category
  async deleteCategory(req: Request, res: Response) {
    try {
      const session = await Session.getSession(req, res);
      const userId = session.getUserId();
      const { id } = req.params;

      // Check if category exists and belongs to user
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingCategory) {
        return void res.status(404).json({ error: "Category not found" });
      }

      // Check if category is used in transactions
      const transactionCount = await prisma.transaction.count({
        where: {
          categoryId: id,
        },
      });

      if (transactionCount > 0) {
        return void res.status(400).json({
          error:
            "Cannot delete category used in transactions. Please reassign transactions first.",
        });
      }

      // Delete category
      await prisma.category.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      return void res.status(500).json({ error: "Failed to delete category" });
    }
  },
};
