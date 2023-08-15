import { PanelHeader } from "./shared";

export default function ChatPanel() {
  return (
    <div className="px-4 pt-4 flex flex-col">
      <PanelHeader title="Feed" />
    </div>
  );
}

import { Fragment } from "react";
import {
  ChatBubbleLeftEllipsisIcon,
  TagIcon,
  UserCircleIcon,
} from "@heroicons/react/20/solid";
import { FeedItem, FeedSnapshotApproval } from "@pixeleye/api";

// const activity: FeedItem[] = [
//   {
//     id: "1",
//     type: "snapshot_approval",
//     createdAt: new Date().toUTCString(),
//     user: {
//       id: "1",
//       name: "John Doe",
//       avatar: "",
//     },
//     attributes: {
//       snapshotID: "1",
//     },
//   },
//   {
//     id: "2",
//     type: "snapshot_approval",
//     createdAt: new Date().toUTCString(),
//     user: {
//       id: "1",
//       name: "John Doe",
//       avatar: "",
//     },
//     attributes: {
//       snapshotID: "2",
//     },
//   },
//   {
//     id: "3",
//     type: "snapshot_rejection",
//     createdAt: new Date().toUTCString(),
//     user: {
//       id: "1",
//       name: "John Doe",
//       avatar: "",
//     },
//     attributes: {
//       snapshotID: "2",
//     },
//   },
//   {
//     id: "4",
//     type: "build_rejection",
//     createdAt: new Date().toUTCString(),
//     user: {
//       id: "1",
//       name: "John Doe",
//       avatar: "",
//     },
//     attributes: {
//       buildID: "1",
//     },
//   },
// ];

// function SnapshotApproval({
//   activityItem,
// }: {
//   activityItem: FeedSnapshotApproval;
// }) {
//   return (
//     <>
//       <div>
//         <div className="relative px-1">
//           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
//             <UserCircleIcon
//               className="h-5 w-5 text-gray-500"
//               aria-hidden="true"
//             />
//           </div>
//         </div>
//       </div>
//       <div className="min-w-0 flex-1 py-1.5">
//         <div className="text-sm text-gray-500">
//           <span className="font-medium text-gray-900">
//             {activityItem.user.name}
//           </span>{" "}
//           approved{" "}
//           <span
//             className="font-medium text-gray-900"
//           >
//             {activityItem.attributes.snapshotID}{" "}
//           </span>{" "}
//           <span className="whitespace-nowrap">{activityItem.date}</span>
//         </div>
//       </div>
//     </>
//   );
// }

// export default function Example() {
//   return (
//     <div className="flow-root">
//       <ul role="list" className="-mb-8">
//         {activity.map((activityItem, activityItemIdx) => (
//           <li key={activityItem.id}>
//             <div className="relative pb-8">
//               {activityItemIdx !== activity.length - 1 ? (
//                 <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
//               ) : null}
//               <div className="relative flex items-start space-x-3">
//                 {activityItem.type === 'comment' ? (
//                   <>
//                     <div className="relative">
//                       <img
//                         className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 ring-8 ring-white"
//                         src={activityItem.imageUrl}
//                         alt=""
//                       />

//                       <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-white px-0.5 py-px">
//                         <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
//                       </span>
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <div>
//                         <div className="text-sm">
//                           <a href={activityItem.person.href} className="font-medium text-gray-900">
//                             {activityItem.person.name}
//                           </a>
//                         </div>
//                         <p className="mt-0.5 text-sm text-gray-500">Commented {activityItem.date}</p>
//                       </div>
//                       <div className="mt-2 text-sm text-gray-700">
//                         <p>{activityItem.comment}</p>
//                       </div>
//                     </div>
//                   </>
//                 ) : activityItem.type === 'assignment' ? (
//                   <>
//                     <div>
//                       <div className="relative px-1">
//                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
//                           <UserCircleIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
//                         </div>
//                       </div>
//                     </div>
//                     <div className="min-w-0 flex-1 py-1.5">
//                       <div className="text-sm text-gray-500">
//                         <a href={activityItem.person.href} className="font-medium text-gray-900">
//                           {activityItem.person.name}
//                         </a>{' '}
//                         assigned{' '}
//                         <a href={activityItem.assigned.href} className="font-medium text-gray-900">
//                           {activityItem.assigned.name}
//                         </a>{' '}
//                         <span className="whitespace-nowrap">{activityItem.date}</span>
//                       </div>
//                     </div>
//                   </>
//                 ) : activityItem.type === 'tags' ? (
//                   <>
//                     <div>
//                       <div className="relative px-1">
//                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white">
//                           <TagIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
//                         </div>
//                       </div>
//                     </div>
//                     <div className="min-w-0 flex-1 py-0">
//                       <div className="text-sm leading-8 text-gray-500">
//                         <span className="mr-0.5">
//                           <a href={activityItem.person.href} className="font-medium text-gray-900">
//                             {activityItem.person.name}
//                           </a>{' '}
//                           added tags
//                         </span>{' '}
//                         <span className="mr-0.5">
//                           {activityItem.tags.map((tag) => (
//                             <Fragment key={tag.name}>
//                               <a
//                                 href={tag.href}
//                                 className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200"
//                               >
//                                 <svg
//                                   className={classNames(tag.color, 'h-1.5 w-1.5')}
//                                   viewBox="0 0 6 6"
//                                   aria-hidden="true"
//                                 >
//                                   <circle cx={3} cy={3} r={3} />
//                                 </svg>
//                                 {tag.name}
//                               </a>{' '}
//                             </Fragment>
//                           ))}
//                         </span>
//                         <span className="whitespace-nowrap">{activityItem.date}</span>
//                       </div>
//                     </div>
//                   </>
//                 ) : null}
//               </div>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   )
// }
