import type { PluginDefinition, Context, Folder, HttpRequest, CallFolderActionArgs } from "@yaakapp/api"

async function getAll(ctx: Context) {
  return await Promise.all([
    ctx.folder.list(),
    ctx.httpRequest.list(),
  ])
}

export const plugin: PluginDefinition = {

  httpRequestActions: [
    {
      label: "Hello, From Plugin",
      icon: "info",
      async onSelect(ctx, args) {
        await ctx.toast.show({
          color: "success",
          message: `You clicked the request ${args.httpRequest.id}`,
        });
      },
    },
  ],

  workspaceActions: [
    {
      label: "Refresh Human IDs",
      async onSelect(ctx, args) {



        await ctx.toast.show({
          color: "success",
          message: `You clicked the workspace`,
        })

      }
    }
  ],

  folderActions: [
    {
      label: "Refresh Human ID",
      async onSelect(ctx, args) {
        assignHumanId(ctx, args)
      }
    }
  ]

}

async function assignHumanId(ctx: Context, args: CallFolderActionArgs) {
  const folderId = args.folder.id
  const folderName = args.folder.name
  const folderModel = args.folder.model

  let newId = [ folderModel, folderName ].join('-')
  if (folderId.startsWith(newId)) {
    console.log('NO NEED TO REFRESH')
    return
  }

  const linked: any[] = []
  const copies: any[] = []

  const [ allFolders, allRequests ] = await getAll(ctx);

  [ ...allFolders, ...allRequests ].forEach(item => {
    if (item.id.startsWith(newId)) copies.push(item)
    if ((item.folderId ?? "").startsWith(folderId)) linked.push(item)
  })

  console.log('COPIES', copies)
  console.log('LINKED', linked)

  // update folder id

  const numCopies = copies.length
  const copyId = numCopies.toString().padStart(2, '0')
  if (numCopies > 0) {
    newId += '-' + copyId
    args.folder.name = `${folderName} ${copyId}`
  }

  args.folder.id = newId

  const updatedFolder = await ctx.folder.update(args.folder)
  if (!updatedFolder) return

  // update links

  const promises = linked.map(async (folder) => {
    if (folder.folderId === folderId) {
      folder.folderId = newId
      return ctx.folder.update(folder)
    }
  })

  await Promise.allSettled(promises)

  // after all updated, delete old copy
  await ctx.folder.delete({ id: folderId })

  await ctx.toast.show({
    color: "success",
    message: `You clicked the folder`,
  })
}
