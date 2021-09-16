const path = require("path")

const setupServer = require("../../../helpers/setup-server")
const { useApi } = require("../../../helpers/use-api")
const { initDb, useDb } = require("../../../helpers/use-db")

const adminSeeder = require("../../helpers/admin-seeder")
const productSeeder = require("../../helpers/product-seeder")

jest.setTimeout(30000)

describe("/admin/products", () => {
  let medusaProcess
  let dbConnection

  beforeAll(async () => {
    const cwd = path.resolve(path.join(__dirname, "..", ".."))
    dbConnection = await initDb({ cwd })
    medusaProcess = await setupServer({ cwd })
  })

  afterAll(async () => {
    const db = useDb()
    await db.shutdown()

    medusaProcess.kill()
  })

  describe("GET /admin/product-variants", () => {
    beforeEach(async () => {
      try {
        await productSeeder(dbConnection)
        await adminSeeder(dbConnection)
      } catch (err) {
        console.log(err)
        throw err
      }
    })

    afterEach(async () => {
      const db = useDb()
      await db.teardown()
    })

    it("lists all product variants", async () => {
      const api = useApi()

      const response = await api
        .get("/admin/variants/", {
          headers: {
            Authorization: "Bearer test_token",
          },
        })
        .catch((err) => {
          console.log(err)
        })

      expect(response.status).toEqual(200)
      expect(response.data.variants).toEqual(
        expect.arrayContaining([
          expect.objectContaining(
            {
              id: "test-variant",
            },
            {
              id: "test-variant_2",
            },
            {
              id: "test-variant_1",
            }
          ),
        ])
      )
    })

    it("lists all product variants matching a specific sku", async () => {
      const api = useApi()
      const response = await api
        .get("/admin/variants?q=sku2", {
          headers: {
            Authorization: "Bearer test_token",
          },
        })
        .catch((err) => {
          console.log(err)
        })

      expect(response.status).toEqual(200)
      expect(response.data.variants.length).toEqual(1)
      expect(response.data.variants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sku: "test-sku2",
          }),
        ])
      )
    })

    it("lists all product variants matching a specific variant title", async () => {
      const api = useApi()
      const response = await api
        .get("/admin/variants?q=rank (1)", {
          headers: {
            Authorization: "Bearer test_token",
          },
        })
        .catch((err) => {
          console.log(err)
        })

      console.log(response.request)
      expect(response.status).toEqual(200)
      expect(response.data.variants.length).toEqual(1)
      expect(response.data.variants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "test-variant_1",
            sku: "test-sku1",
          }),
        ])
      )
    })

    it("lists all product variants matching a specific product title", async () => {
      const api = useApi()
      const response = await api
        .get("/admin/variants?q=Test product1", {
          headers: {
            Authorization: "Bearer test_token",
          },
        })
        .catch((err) => {
          console.log(err)
        })

      expect(response.status).toEqual(200)
      expect(response.data.variants.length).toEqual(2)
      expect(response.data.variants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            product_id: "test-product1",
            id: "test-variant_3",
            sku: "test-sku3",
          }),
          expect.objectContaining({
            product_id: "test-product1",
            id: "test-variant_4",
            sku: "test-sku4",
          }),
        ])
      )
    })
  })
})
