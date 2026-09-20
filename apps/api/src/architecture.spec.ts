import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sources(path) : path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : []
  })
}

const files = sources(join(__dirname, 'modules'))
function imports(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  return source.statements.flatMap((statement) => {
    if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      return [statement.moduleSpecifier.text]
    }
    return []
  })
}

describe('Architecture boundaries (D-020)', () => {
  it('keeps domain independent of frameworks and outer layers', () => {
    const violations = files.filter((file) => file.replaceAll('\\', '/').includes('/domain/')).flatMap((file) =>
      imports(file).filter((dependency) => /@nestjs|@prisma|\/(application|infrastructure|presentation)\//.test(dependency))
        .map((dependency) => `${relative(__dirname, file)} -> ${dependency}`),
    )
    expect(violations).toEqual([])
  })

  // Admin and Ranking still need a separate persistence refactor; this guard
  // protects every other module, including the application boundaries fixed here.
  it('keeps application code outside Admin/Ranking independent of infrastructure adapters', () => {
    const violations = files.filter((file) => {
      const path = file.replaceAll('\\', '/')
      return path.includes('/application/') && !/\/modules\/(admin|ranking)\//.test(path)
    }).flatMap((file) => imports(file)
      .filter((dependency) => /\/infrastructure\/|\/presentation\/|@prisma|^cloudinary$|^ioredis$/.test(dependency))
      .map((dependency) => `${relative(__dirname, file)} -> ${dependency}`))
    expect(violations).toEqual([])
  })

  it('keeps controllers independent of Prisma and Redis', () => {
    const violations = files.filter((file) => file.endsWith('.controller.ts')).flatMap((file) => imports(file)
      .filter((dependency) => /prisma|redis/.test(dependency))
      .map((dependency) => `${relative(__dirname, file)} -> ${dependency}`))
    expect(violations).toEqual([])
  })
})
