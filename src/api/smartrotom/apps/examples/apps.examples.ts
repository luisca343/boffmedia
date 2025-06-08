export const AppsExamples = {
  responses: {
    findAll: {
      success: true,
      message: 'Apps found successfully',
      data: [
        {
          "id": 1,
          "name": "ChatApp",
          "url": "chatapp",
          "active": 1
        },
        {
          "id": 2,
          "name": "Admin",
          "url": "admin",
          "active": 0
        },
        {
          "id": 3,
          "name": "Arcade",
          "url": "arcade",
          "active": 1
        },
      ]
    },
    
    create: {
      success: true,
      message: 'App created successfully',
      data: {
        id: 4,
        name: 'Mina',
        url: 'mina',
        active: 1,
        createdAt: '2024-06-08T12:00:00.000Z',
        updatedAt: '2024-06-08T12:00:00.000Z'
      }
    },
    
    order: {
      success: true,
      message: 'Apps ordered successfully',
      data: {
        success: true
      }
    },
    
    getForPlayer: {
      success: true,
      message: 'Apps found for player successfully',
      data: [
        {
          "id": 2,
          "url": "admin",
          "name": "Admin",
          "orden": 16,
          "is_user_app": 1
        },
        {
          "id": 3,
          "url": "arcade",
          "name": "Arcade",
          "orden": 999,
          "is_user_app": 0
        },
        {
          "id": 4,
          "url": "bidkea",
          "name": "Bidkea",
          "orden": 999,
          "is_user_app": 0
        }
      ]
    },
    
    addAppToPlayer: {
      success: true,
      message: 'App added to player successfully',
      data: {
        success: true
      }
    },
    
    removeAppFromPlayer: {
      success: true,
      message: 'App removed from player successfully',
      data: {
        success: true
      }
    },
    
    findOne: {
      success: true,
      message: 'App found successfully',
      data: {
        "id": 1,
        "name": "ChatApp",
        "url": "chatapp",
        "active": 1
      }
    },
    
    update: {
      success: true,
      message: 'App updated successfully',
      data: {
        id: 1,
        name: 'Updated App Name',
        url: 'https://updated-example.com',
        active: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-06-08T12:00:00.000Z'
      }
    },
    
    remove: {
      success: true,
      message: 'App deleted successfully',
      data: {
        success: true
      }
    },
    
    notFound: {
      success: false,
      message: 'App with ID 999 not found',
      error: 'NOT_FOUND'
    }
  },
  
  requests: {
    orderApps: {
      newOrder: [
        { id: 1, order: 1 },
        { id: 3, order: 2 },
        { id: 2, order: 3 }
      ],
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      server: '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365'
    },
    
    getPlayerApps: {
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      server: '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365'
    },
    
    addAppToPlayer: {
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      id: 1,
      server: '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365'
    },
    
    removeAppFromPlayer: {
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      id: 1,
      server: '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365'
    },
    
    updateApp: {
      name: 'ChatApp v2',
      url: 'chatappv2',
      server: '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365'
    }
  }
};