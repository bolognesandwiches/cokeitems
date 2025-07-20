// Configuration for different environments
const config = {
  development: {
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true' || true,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    mockData: {
      catalog: [
        {
          prodId: 1,
          name: '"Test Item 1"',
          catName: '"Test Category"',
          type: '"Furniture"',
          catDesc: '"A test item for development"',
          imageBase: '"test_item"'
        },
        {
          prodId: 2,
          name: '"Test Item 2"',
          catName: '"Test Category"',
          type: '"Decoration"',
          catDesc: '"Another test item for development"',
          imageBase: '"test_item2"'
        },
        {
          prodId: 3,
          name: '"Coke Machine"',
          catName: '"Vending"',
          type: '"Machine"',
          catDesc: '"A classic Coke vending machine"',
          imageBase: '"76_cokemachine"'
        },
        {
          prodId: 4,
          name: '"Jukebox"',
          catName: '"Entertainment"',
          type: '"Music"',
          catDesc: '"Vintage jukebox for playing music"',
          imageBase: '"80_jukebox"'
        },
        {
          prodId: 5,
          name: '"Aquarium"',
          catName: '"Decoration"',
          type: '"Aquatic"',
          catDesc: '"Beautiful aquarium with fish"',
          imageBase: '"79_aquarium"'
        },
        {
          prodId: 6,
          name: '"Northern Light"',
          catName: '"Lighting"',
          type: '"Lamp"',
          catDesc: '"A beautiful northern light lamp"',
          imageBase: '"12_northern_light"'
        },
        {
          prodId: 7,
          name: '"Microphone"',
          catName: '"Audio"',
          type: '"Recording"',
          catDesc: '"Professional microphone for recording"',
          imageBase: '"13_microphone"'
        },
        {
          prodId: 8,
          name: '"Pinball Machine"',
          catName: '"Games"',
          type: '"Arcade"',
          catDesc: '"Classic pinball machine"',
          imageBase: '"75_pinball"'
        }
      ],
      possessions: [
        {
          id: 1,
          catalogItemId: 1,
          datePurchased: '2024-01-15T10:30:00Z',
          purchasePrice: 100
        },
        {
          id: 2,
          catalogItemId: 3,
          datePurchased: '2024-01-20T14:45:00Z',
          purchasePrice: 0
        },
        {
          id: 3,
          catalogItemId: 4,
          datePurchased: '2024-02-01T09:15:00Z',
          purchasePrice: 250
        },
        {
          id: 4,
          catalogItemId: 5,
          datePurchased: '2024-02-10T16:20:00Z',
          purchasePrice: 150
        },
        {
          id: 5,
          catalogItemId: 6,
          datePurchased: '2024-02-15T11:00:00Z',
          purchasePrice: 75
        },
        {
          id: 6,
          catalogItemId: 7,
          datePurchased: '2024-02-20T13:30:00Z',
          purchasePrice: 200
        },
        {
          id: 7,
          catalogItemId: 8,
          datePurchased: '2024-02-25T15:45:00Z',
          purchasePrice: 300
        },
        {
          id: 8,
          catalogItemId: 3,
          datePurchased: '2024-03-01T10:15:00Z',
          purchasePrice: 0
        }
      ]
    }
  },
  production: {
    useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true' || false,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api'
  }
};

// Determine current environment
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const currentConfig = config[isDevelopment ? 'development' : 'production'];

export default currentConfig; 