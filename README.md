# GIS Portfolio Website

Static bilingual portfolio website for a GIS / Geomatics Engineering specialist focused on smart municipal transformation, Web GIS dashboards, UAV mapping, 360 Street View documentation, and municipal spatial data infrastructure.

## Privacy Approach

- The public interface does not visibly display the owner email address.
- Email and WhatsApp links are generated at runtime from separated JavaScript parts.
- The contact form opens the visitor's email app with a prepared message; no message is stored by this static site.
- This approach reduces casual scraping, but it does not make the destination email perfectly secret. Static websites cannot fully hide destination contact details from advanced scrapers.
- For stronger privacy, replace `mailto:` with a backend or trusted contact-form service.

## Public GIS Data Safety

This public portfolio version must not include raw GIS data, exact coordinates, personal information, restricted infrastructure layers, or sensitive attributes.

Do not commit or publish raw GIS files such as:

- `.shp`, `.shx`, `.dbf`, `.prj`
- `.geojson`, `.kml`, `.kmz`, `.gpkg`
- `.tif`, `.tiff`, `.las`, `.laz`

Before publishing, manually review all images and dashboard screenshots for:

- EXIF/GPS metadata
- exact coordinates
- private asset identifiers
- personal information
- restricted infrastructure details
- sensitive damage-assessment attributes

## GitHub Pages Deployment

This is a static site and can be deployed with GitHub Pages.

Typical deployment steps:

```bash
git status
git add .
git commit -m "Improve portfolio privacy before GitHub Pages deployment"
git push
```

Then enable GitHub Pages from the repository settings and select the branch/folder used for deployment.

## Indexing

`robots.txt` currently blocks indexing by default. Update it only after the owner confirms that the public portfolio should be indexed by search engines.

## Licensing

Code may be licensed under MIT only if the owner explicitly agrees.

Images, maps, GIS outputs, dashboard screenshots, project materials, and municipal documentation are All Rights Reserved. They should not be treated as open-source assets.
