export default {
    "name": "C:/[Work]/react-boilerplate/server/schema/Banner",
    "filename": "C:/[Work]/react-boilerplate/server/schema/Banner.d.ts",
    "exports": [{
            "name": "BannerItem",
            "type": "Interface"
        },
        {
            "name": "Banner",
            "type": "Interface"
        }
    ],
    "members": [{
            "name": "BannerItem",
            "members": [{
                    "name": "link",
                    "type": "string",
                    "isRequired": false
                },
                {
                    "name": "image",
                    "type": "string",
                    "isRequired": false
                },
                {
                    "name": "toNewWindow",
                    "type": "boolean",
                    "isRequired": false
                }
            ],
            "type": "Interface"
        },
        {
            "name": "Banner",
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
                    "name": "bannerName",
                    "isRequired": true,
                    "type": "string"
                },
                {
                    "name": "banners",
                    "type": "BannerItem[]",
                    "isRequired": false
                },
                {
                    "name": "titles",
                    "isRequired": true,
                    "type": "string[]"
                }
            ],
            "type": "Interface"
        }
    ],
    "type": "typeof import(\"C:/[Work]/react-boilerplate/server/schema/Banner\")",
    "locals": [{
            "name": "BannerItem",
            "type": "NamespaceModuleExcludes"
        },
        {
            "name": "Banner",
            "type": "NamespaceModuleExcludes"
        }
    ]
}