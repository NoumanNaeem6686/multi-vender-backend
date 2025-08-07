import prisma from "../../prisma/index.js";
import {
  validateRequiredFields,
  validateCategoryName,
  generateSlug,
} from "../utils/validation.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/validation.js";

// Admin: Create category
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentId, image, sortOrder } = req.body;

    const fieldsValidation = validateRequiredFields(req.body, ["name"]);
    if (!fieldsValidation.isValid) {
      return res.status(400).json({
        status: "error",
        message: fieldsValidation.message,
      });
    }

    const nameValidation = validateCategoryName(name);
    if (!nameValidation.isValid) {
      return res.status(400).json({
        status: "error",
        message: nameValidation.message,
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existingCategory) {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.CATEGORY_EXISTS,
      });
    }

    if (parentId) {
      const parentCategory = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        return res.status(400).json({
          status: "error",
          message: "Parent category not found",
        });
      }
    }

    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        slug,
        image,
        parentId,
        sortOrder: sortOrder || 0,
      },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { children: true, products: true },
        },
      },
    });

    return res.status(201).json({
      status: "success",
      data: category,
      message: SUCCESS_MESSAGES.CATEGORY_CREATED,
    });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Admin: Get all categories (including inactive)
export const getAllCategories = async (req, res) => {
  try {
    const { includeInactive, parentId } = req.query;

    const whereClause = {};

    if (parentId !== undefined) {
      whereClause.parentId = parentId === "null" ? null : parentId;
    }

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        parent: {
          select: { id: true, name: true },
        },
        children: {
          where: includeInactive ? {} : { isActive: true },
          select: { id: true, name: true, slug: true, isActive: true },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return res.status(200).json({
      status: "success",
      data: categories,
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Public: Get active categories only
export const getActiveCategories = async (req, res) => {
  try {
    const { parentId } = req.query;

    const whereClause = { isActive: true };

    if (parentId !== undefined) {
      whereClause.parentId = parentId === "null" ? null : parentId;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        image: true,
        sortOrder: true,
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: {
            products: { where: { isActive: true, adminApproved: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return res.status(200).json({
      status: "success",
      data: categories,
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get active categories error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Public: Get category tree (hierarchical structure)
export const getCategoryTree = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        sortOrder: true,
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            sortOrder: true,
            _count: {
              select: {
                products: { where: { isActive: true, adminApproved: true } },
              },
            },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
        _count: {
          select: {
            products: { where: { isActive: true, adminApproved: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return res.status(200).json({
      status: "success",
      data: categories,
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get category tree error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Admin/Public: Get single category
export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeInactive } = req.query;

    const whereClause = { id };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const category = await prisma.category.findUnique({
      where: whereClause,
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: includeInactive ? {} : { isActive: true },
          select: { id: true, name: true, slug: true, isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
        _count: {
          select: {
            products: includeInactive
              ? true
              : { where: { isActive: true, adminApproved: true } },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.CATEGORY_NOT_FOUND,
      });
    }

    return res.status(200).json({
      status: "success",
      data: category,
      message: SUCCESS_MESSAGES.STATUS_RETRIEVED,
    });
  } catch (error) {
    console.error("Get category error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Admin: Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, image, sortOrder } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.CATEGORY_NOT_FOUND,
      });
    }

    const updateData = {};

    if (name !== undefined) {
      const nameValidation = validateCategoryName(name);
      if (!nameValidation.isValid) {
        return res.status(400).json({
          status: "error",
          message: nameValidation.message,
        });
      }

      const nameExists = await prisma.category.findFirst({
        where: {
          name: name.trim(),
          id: { not: id },
        },
      });

      if (nameExists) {
        return res.status(400).json({
          status: "error",
          message: ERROR_MESSAGES.CATEGORY_EXISTS,
        });
      }

      updateData.name = name.trim();

      if (name.trim() !== existingCategory.name) {
        const baseSlug = generateSlug(name);
        let slug = baseSlug;
        let counter = 1;

        while (
          await prisma.category.findFirst({
            where: { slug, id: { not: id } },
          })
        ) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        updateData.slug = slug;
      }
    }

    if (parentId !== undefined) {
      if (parentId === id) {
        return res.status(400).json({
          status: "error",
          message: "Category cannot be its own parent",
        });
      }

      if (parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parentCategory) {
          return res.status(400).json({
            status: "error",
            message: "Parent category not found",
          });
        }
      }

      updateData.parentId = parentId;
    }

    // Update other fields
    if (description !== undefined) updateData.description = description?.trim();
    if (image !== undefined) updateData.image = image;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { children: true, products: true },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      data: updatedCategory,
      message: SUCCESS_MESSAGES.CATEGORY_UPDATED,
    });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Admin: Toggle category status
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.CATEGORY_NOT_FOUND,
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        isActive: !category.isActive,
      },
    });

    return res.status(200).json({
      status: "success",
      data: updatedCategory,
      message: SUCCESS_MESSAGES.CATEGORY_STATUS_UPDATED,
    });
  } catch (error) {
    console.error("Toggle category status error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// Admin: Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        status: "error",
        message: ERROR_MESSAGES.CATEGORY_NOT_FOUND,
      });
    }

    if (category._count.products > 0) {
      return res.status(400).json({
        status: "error",
        message: ERROR_MESSAGES.CATEGORY_HAS_PRODUCTS,
      });
    }

    if (category._count.children > 0) {
      return res.status(400).json({
        status: "error",
        message: "Cannot delete category with subcategories",
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.status(200).json({
      status: "success",
      message: SUCCESS_MESSAGES.CATEGORY_DELETED,
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({
      status: "error",
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};
