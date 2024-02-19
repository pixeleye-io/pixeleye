
import { promises as fs } from 'fs';


export default async function TermsPage() {

    const file = await fs.readFile(process.cwd() + '/src/app/(legal)/terms-of-service/content.html', 'utf8');

    return <div className="bg-white p-8" dangerouslySetInnerHTML={{ __html: file }} />;
}