import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertProductSchema, insertServiceSchema, insertInvoiceSchema, insertInvoiceItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  // Customers
  app.get("/api/customers", async (_req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.post("/api/customers", async (req, res) => {
    const data = insertCustomerSchema.parse(req.body);
    const customer = await storage.createCustomer(data);
    res.json(customer);
  });

  // Products
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const data = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(data);
    res.json(product);
  });

  // Services
  app.get("/api/services", async (_req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.post("/api/services", async (req, res) => {
    const data = insertServiceSchema.parse(req.body);
    const service = await storage.createService(data);
    res.json(service);
  });

  // Invoices
  app.get("/api/invoices", async (_req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(Number(req.params.id));
    if (!invoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }
    const items = await storage.getInvoiceItems(invoice.id);
    res.json({ ...invoice, items });
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      console.log('Received invoice data:', JSON.stringify(req.body, null, 2));
      const { invoice, items } = req.body;

      if (!invoice || !items || !Array.isArray(items)) {
        res.status(400).json({ error: "Invalid invoice data format" });
        return;
      }

      // Validate invoice data
      const validatedInvoice = insertInvoiceSchema.parse({
        ...invoice,
        customerId: Number(invoice.customerId),
        total: Number(invoice.total),
      });

      // Validate each item
      const validatedItems = items.map((item: any) =>
        insertInvoiceItemSchema.parse({
          ...item,
          price: Number(item.price),
          quantity: Number(item.quantity),
          productId: item.productId ? Number(item.productId) : null,
          serviceId: item.serviceId ? Number(item.serviceId) : null,
        })
      );

      console.log('Validated invoice:', JSON.stringify(validatedInvoice, null, 2));
      console.log('Validated items:', JSON.stringify(validatedItems, null, 2));

      const newInvoice = await storage.createInvoice(validatedInvoice, validatedItems);
      res.json(newInvoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(400).json({ error: String(error) });
    }
  });

  // Expenses
  app.get("/api/expenses", async (_req, res) => {
    const expenses = await storage.getExpenses();
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    const data = insertExpenseSchema.parse(req.body);
    const expense = await storage.createExpense(data);
    res.json(expense);
  });

  const httpServer = createServer(app);
  return httpServer;
}