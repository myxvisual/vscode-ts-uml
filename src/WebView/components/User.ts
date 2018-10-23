export default {
    "name": "C:/[Work]/react-boilerplate/server/schema/User",
    "filename": "C:/[Work]/react-boilerplate/server/schema/User.d.ts",
    "exports": [{
            "name": "Banner",
            "escapedName": "Banner",
            "type": "AliasExcludes",
            "filename": "C:/[Work]/react-boilerplate/server/schema/Banner.d.ts"
        },
        {
            "name": "Color",
            "type": "Interface"
        },
        {
            "name": "A",
            "type": "BlockScopedVariable"
        },
        {
            "name": "User",
            "type": "Interface"
        }
    ],
    "members": [{
            "name": "Color",
            "members": [{
                "name": "color",
                "type": "string",
                "isRequired": false
            }],
            "type": "Interface"
        },
        {
            "name": "User",
            "members": [{
                    "name": "_id",
                    "type": "number",
                    "isRequired": false
                },
                {
                    "name": "__v",
                    "type": "number",
                    "isRequired": false
                },
                {
                    "name": "userName",
                    "isRequired": true,
                    "type": "string"
                },
                {
                    "name": "password",
                    "isRequired": true,
                    "type": "string"
                },
                {
                    "name": "hashedPassword",
                    "type": "string",
                    "isRequired": false
                },
                {
                    "name": "email",
                    "isRequired": true,
                    "type": "string",
                    "documentation": "unique: true"
                },
                {
                    "name": "phoneNumber",
                    "isRequired": true,
                    "type": "string",
                    "documentation": "unique: true"
                },
                {
                    "name": "banners",
                    "isRequired": true,
                    "type": "Banner[]"
                },
                {
                    "name": "mock",
                    "isRequired": true,
                    "type": "Mock"
                }
            ],
            "type": "Interface",
            "extends": [{
                    "name": "Banner",
                    "escapedName": "Banner",
                    "type": "AliasExcludes",
                    "filename": "C:/[Work]/react-boilerplate/server/schema/Banner.d.ts"
                },
                {
                    "name": "Color",
                    "type": "Interface"
                }
            ]
        }
    ],
    "type": "ValueModule",
    "resolvedModules": [],
    "locals": [{
            "name": "Banner",
            "escapedName": "Banner",
            "type": "AliasExcludes",
            "filename": "C:/[Work]/react-boilerplate/server/schema/Banner.d.ts"
        },
        {
            "name": "Mock2",
            "escapedName": "Mock",
            "type": "AliasExcludes",
            "filename": "C:/[Work]/react-boilerplate/server/schema/Mock.d.ts"
        },
        {
            "name": "fs",
            "escapedName": "\"fs\"",
            "type": "AliasExcludes"
        },
        {
            "name": "Color",
            "type": "NamespaceModuleExcludes"
        },
        {
            "name": "A",
            "type": "ExportValue"
        },
        {
            "name": "User",
            "type": "NamespaceModuleExcludes"
        }
    ]
}