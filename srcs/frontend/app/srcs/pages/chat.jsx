import ftReact          from '../ft_react';
import { apiClient }    from '../api/api_client';
import BarLayout        from '../components/barlayout';
import WebsocketClient  from '../api/websocket_client';
import Avatar           from '../components/avatar';

const units = {
    year  : 24 * 60 * 60 * 1000 * 365,
    month : 24 * 60 * 60 * 1000 * 365/12,
    day   : 24 * 60 * 60 * 1000,
    hour  : 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
  }
  
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const getRelativeTime = (d1, d2 = new Date()) => {
const elapsed = d1 - d2

for (let u in units) 
    if (Math.abs(elapsed) > units[u] || u == 'second') 
    return rtf.format(Math.round(elapsed/units[u]), u)
}

const SelectedChat = (props) => {
    const [trigger, setTrigger] = ftReact.useState(false);
    const me = JSON.parse(localStorage.getItem('me'));
    const user = props.chat.participants;
    const limit = 10;
    const getOldMsgs = async (chat_id) => {
        if (props.paginator[chat_id] === -1)
            return;
        const resp = await apiClient.get(`/chats/${chat_id}/messages`, {limit: limit, skip: props.paginator[chat_id] || 0});
        if (resp.error) {
            if (resp.error === "Chat not found") {
                props.setChats(props.chats.filter(chat => chat.id !== chat_id));
                props.setChatSelected(null);
            }
            return ;
        }
        if (resp.length < limit) {
            observer?.disconnect();
            observer = null;
            props.setPaginator({...props.paginator, [chat_id]: -1});
        }
        else
            props.setPaginator({...props.paginator, [chat_id]: (props.paginator[chat_id] || 0) + limit});
        props.updateMsgs(resp, false);
    };
    ftReact.useEffect(async () => {
        if (trigger) {
            setTrigger(false);
            await getOldMsgs(props.chatSelected);
        }
    }, [trigger, getOldMsgs, props.chatSelected]);
    ftReact.useEffect(() => {
        const handleIntersection = (entries) => {
            if (entries[0].isIntersecting && props.chatSelected) {
                setTrigger(true);
            }
        };
        const sentinel = document.getElementById('sentinel');
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (sentinel && props.chatSelected && props.paginator[props.chatSelected] !== -1) {
            observer = new IntersectionObserver(handleIntersection, { threshold: 1.0 });
            observer.observe(sentinel);
        }
        return () => {
            if (sentinel && observer) {
                observer.unobserve(sentinel);
                observer.disconnect();
            }
        };
    }, [props.chatSelected, props.paginator, setTrigger]);
    ftReact.useEffect(async () => {
        if (props.chatSelected && !props.msgs.some(msg => msg.chat_id === props.chatSelected)) {
            await getOldMsgs(props.chatSelected, true);
        }
    }, [props.chatSelected, getOldMsgs]);
    return (
            <div className='col-8 px-0 border rounded-end d-flex flex-column justify-content-between'>
                <div className='d-flex flex-row'>
                    <div className='w-100 border-bottom d-flex flex-row align-items-center justify-content-start gap-3 px-3' style={{height: "5rem"}}>
                        {user && 
                            <img
                                loading="lazy"
                                width={50}
                                style={{objectFit: 'cover', borderRadius: '100%', aspectRatio: '1 / 1'}}
                                src={`https://api.${window.location.hostname}${user.avatar}`}
                                className="img-thumbnail"
                            />
                        }
                        <h3 className='align-middle'>
                            <a onClick={
                                (ev) => {
                                    ev.preventDefault();
                                    props.route(`/users/${user ? user.id : "me"}`);
                                }
                            }>
                                {user ? user.username : "Chat"}
                            </a>
                        </h3>
                    </div>
                    <div className='border-bottom d-flex flex-row align-items-center justify-content-start gap-3 px-3' style={{height: "5rem"}}>
                       <button 
                            className={props.invitation ? 'btn btn-outline-secondary disabled' : 'btn btn-outline-success'}
                            style={{ minWidth: '90px' }}
                            onClick={async () => {
                                ws && ws.send(JSON.stringify({
                                    type: "game.invite",
                                    chat_id: props.chatSelected,
                                    action: 'create'
                                }));
                                props.setInvitation(props.chatSelected);
                            }}
                        >
                            {!props.invitation ? <h6>Invite to game</h6> : <h6>Pending Invitation</h6>}
                        </button>
                        <button
                            className='btn btn-outline-danger'
                            onClick={async () => {
                                const data = await apiClient.delete('/chats', {chat_id: props.chatSelected});
                                if (data.error) {
                                    return;
                                }
                                props.setChats(props.chats.filter(chat => chat.id !== props.chatSelected));
                                props.setChatSelected(null);
                            }}
                        >
                            <h6>Delete Chat</h6>
                        </button>
                    </div>
                </div>
                <div className='d-flex flex-column justify-content-between'>
                    <div
                        id="msgs-container"
                        className='d-flex flex-column align-items-start p-2 text-wrap text-start overflow-y-auto'
                        style={{maxHeight: "70vh", scrollbarWidth: "thin"}}
                    >
                        <div id="sentinel"></div>
                        {   props.chatSelected &&
                            props.msgs &&
                            props.msgs
                                .filter(msg => msg.chat_id === props.chatSelected)
                                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                                .map(msg =>
                                    <div
                                        className={
                                            msg.content
                                                ? (
                                                    msg.sender?.id === me.id
                                                        ? ' align-self-end \
                                                            text-end \
                                                            bg-gray \
                                                            border rounded-4 \
                                                            py-1 px-2 my-1 \
                                                            '
                                                        : ' bg-gray border rounded-4 py-1 px-2 my-1'
                                                )
                                                : 'text-center w-100'
                                        }
                                        style={{wordWrap: "break-word", maxWidth: "75%", overflowWrap: "break-word"}}
                                    >
                                        <div className='d-flex flex-column gap-0'>
                                            <span className='text-break'>
                                                {msg.content ? msg.content : msg.status}
                                            </span>
                                            <span className="align-self-end text-secondary" style={{fontSize: '0.7rem'}}>
                                            {getRelativeTime(new Date(msg.timestamp))}
                                            </span>
                                        </div>
                                    </div>
                                )
                        }
                        <div id="msgs-end" style={{visibility: "hidden"}}/>
                    </div>
                    <form
                        onSubmit={(ev)=>{
                            ev.preventDefault();
                            const msg = ev.target[0].value;
                            if (ws) {
                                ws.send(JSON.stringify({
                                    chat_id: props.chatSelected,
                                    type: "plain.message",
                                    content: msg
                                }));
                                // props.updateMsgs({content: msg, sender_name: "me"});
                                ev.target[0].value = "";
                            }
                        }}
                    >
                        <div className="input-group mt-auto">
                            <input
                                required
                                type="text"
                                className="form-control"
                                placeholder="New message"
                                aria-describedby="button-addon2"
                            />
                            <button
                                className="btn btn-outline-secondary"
                                type="submit"
                                id="button-addon2"
                            >Send</button>
                        </div>
                    </form>
                </div>
            </div>
    );
};

let observer = null;
let ws = null;
let prevListener = null;
let prevOpenListener = null;

const Chats = (props) => {
    const [chats, setChats] = ftReact.useState([]);
    const [error, setError] = ftReact.useState(null);
    const [chatSelected, setChatSelected] = ftReact.useState(null);
    const [msgs, setMsgs] = ftReact.useState([]);
    const [paginator, setPaginator] = ftReact.useState({});
    const [activeFriends, setActiveFriends] = ftReact.useState(null);
    const [invitation, setInvitation] = ftReact.useState(null);
    const me = JSON.parse(localStorage.getItem('me'));
    const limit = 10;
    ftReact.useEffect(async () => {
        const getChats = async () => {
            const data = await apiClient.get('/chats');
            if (data.error) {
                setError(data.error);
                return;
            }
            if (data.status === "No chats found") {
                return;
            }
            setChats(data);
        };
        if (!chats.length && !error) {
            await getChats();
        }
    }, [chats, setChats, error, setError]);
    ftReact.useEffect(() => {
        if (chats &&  msgs && chatSelected && ws) {
            const unread_ids = msgs.filter(msg => msg.chat_id === chatSelected && msg.sender.id !== me.id && !msg.read).map(msg => msg.id);
            if (unread_ids.length > 0) {
                ws.send(JSON.stringify({
                    type: "message.management",
                    ids: unread_ids,
                    chat_id: chatSelected
                }));
            }
        }
    }, [chatSelected]);
    const updateActiveUsers = (data) => {
        if (data.type === 'client.update')
            setActiveFriends(data['active_friends_ids']);
        else if (data.type === 'status.update') {
            if (data.status === 'connected')
                setActiveFriends([...activeFriends, data.sender_id]);
            else if (data.status === 'disconnected')
                setActiveFriends(activeFriends.filter(id => id !== data.sender_id))
        }
    };
    const updateUnreadMessages = (data) => {
        const chat_id = data.chat_id;
        const unread_messages = data.unread_messages;
        const new_chats = chats.map(chat => {
            if (chat.id === chat_id) {
                return {...chat, unread_messages: unread_messages};
            }
            return chat;
        });
        setChats(new_chats);
    };
    ftReact.useEffect(() => {
        const handleMessage = (ev) => {
            const data = JSON.parse(ev.data);
            if ("type" in data && data.type === 'plain.message') {
                updateMsgs(data.message);
            };
            if ("type" in data && (data.type === 'status.update' || data.type === 'client.update')) {
                updateActiveUsers(data);
            }
            if ('type' in data && data.type === "unread.messages") {
                if (data.game_invite != null)
                    setInvitation([data.game_invite])
            }
            if ("status" in data && data.status === "client connected") {
                let invitation = data.game_invite;
                if (invitation) {
                    setInvitation(invitation);
                }
            }
            if ("status" in data && data.status === 'chat.created') {
                setChats([...chats, data.chat]);
            }
            if ("status" in data && data.status === 'game.invite.deleted') {
                setInvitation(null);
            }
            if ("status" in data && data.status === 'chat.deleted') {
                setChats(chats.filter(chat => chat.id !== data.chat_id));
                if (chatSelected === data.chat_id)
                    setChatSelected(null);
            }
            if ("status" in data && data.status === 'message.management') {
                updateUnreadMessages(data);
            }
            if ("status" in data && data.status === 'active.friends') {
                setActiveFriends(data.active_friends_ids);
            }
            if ('status' in data && data.status === "error")
            {
                if ('message' in data && data.message === 'User busy')
                    setInvitation(null);
            }
        }
        const handleOpen = (ev) => {
            !activeFriends && ws.send(JSON.stringify({type: "active.friends"}));
        }
        ws = new WebsocketClient("wss://api.localhost/ws/chat/dm/", localStorage.getItem("access_token")).getWs();
        if (ws.readyState === WebSocket.OPEN)
           handleOpen();
        else {
            if (handleOpen)
                ws.removeEventListener('open', handleOpen);
            ws.addEventListener('open', handleOpen);
            prevOpenListener = handleOpen;
        }
        if (prevListener)
            ws.removeEventListener('message', prevListener);
        ws.addEventListener('message', handleMessage);
        prevListener = handleMessage;
        return () => {
            ws && prevListener && ws.removeEventListener('message', prevListener);
            ws && prevOpenListener && ws.removeEventListener('open', prevOpenListener);
        };

    }, [msgs, setMsgs, updateMsgs]);
    const updateMsgs = (msg, to_end = true) => {
        if (Array.isArray(msg) && msg.length === 0)
            return;
        const msgsContainer = document.getElementById("msgs-container");
        const sentinel = document.getElementById('sentinel');
        sentinel && observer?.unobserve(sentinel);
        const currentScrollHeight = msgsContainer?.scrollHeight;
        const currentScrollTop = msgsContainer?.scrollTop;
        to_end
            ? setMsgs([...msgs, ...Array.isArray(msg) ? msg : [msg]])
            : setMsgs([...Array.isArray(msg) ? msg : [msg], ...msgs]);
        to_end
            ? setTimeout(
		    	() => document.getElementById("msgs-end")?.scrollIntoView(),
		    	100
		    )
            : setTimeout(() => {
                const newScrollHeight = msgsContainer.scrollHeight;
                msgsContainer.scrollTop = newScrollHeight - currentScrollHeight + currentScrollTop;
                if (observer && sentinel && chatSelected && paginator[chatSelected] !== -1) {
                    sentinel && observer?.observe(sentinel);
                }
            }, 100);
        const chat_id = Array.isArray(msg) ? msg[0].chat_id : msg.chat_id;
        const ids = Array.isArray(msg)
                        ? msg.map(msg => {
                                if (msg.chat_id === chat_id && msg.sender.id !== me.id && !msg.read)
                                    return msg.id;
                            }).filter(id => id)
                        : ( msg.chat_id === chat_id &&
                            msg.sender.id !== me.id &&
                            !msg.read)
                            ? [msg.id] 
                            : [];
        if (chatSelected === chat_id && ids.length > 0) {
            ws.send(JSON.stringify({
                type: "message.management",
                ids: ids,
                chat_id : chat_id
            }));
        }
        else if (ids.length > 0)
        {
            const new_chats = chats.map(chat => {
                if (chat.id === chat_id) {
                    return {...chat, unread_messages: chat.unread_messages + ids.length};
                }
                return chat;
            });
            setChats(new_chats);
        }
    };
    return (
        <BarLayout route={props.route}>
            <div className='d-grid w-100 w-md-75 w-xxl-50' style={{minHeight: "95%"}}>
                <div className='row'>
                    <div className={chatSelected ? 'col-4 px-0 border rounded-start' : 'col border rounded px-0'}>
                        <div className='w-100 border-bottom py-3' style={{height: "4rem"}}>
                            <h3 className='align-middle'>Chats</h3>
                        </div>
                        {chats && chats.map((chat) => {
                            return (
                                <div
                                    key={chat.id}
                                    className='border-bottom'
                                    style={{cursor: "pointer", backgroundColor: chatSelected === chat.id ? "green" : ""}}
                                    onClick={async () => {
                                        observer?.disconnect();
                                        observer = null;
                                        document.getElementById("msgs-end")?.scrollIntoView();
                                        setChatSelected(chat.id);
                                    }
                                    }
                                >
                                    <div className='d-flex flex-row justify-content-start align-items-center gap-2 p-2'>
                                        <Avatar img={chat.participants.avatar} size={'40rem'}/>
                                        {chat.participants.username}
                                        {activeFriends && activeFriends.includes(chat.participants.id) &&
                                            <span class="p-2 bg-success border border-light rounded-circle">
                                                <span class="visually-hidden">Active User</span>
                                                
                                            </span>
                                        }
                                        {chat["unread_messages"] > 0 && 
                                            <span class="badge rounded-pill bg-danger">
                                                {chat["unread_messages"]}
                                                <span class="visually-hidden">unread messages</span>
                                            </span>
                                        }
                                    </div>   
                                </div>
                            );
                        })}
                    </div>
                    {   chatSelected && 
                        chats &&
                        <SelectedChat
                            chatSelected={chatSelected}
                            chat={chats.find(chat => chat.id === chatSelected)}
                            msgs={msgs}
                            ws={ws}
                            updateMsgs={updateMsgs}
                            paginator={paginator}
                            setPaginator={setPaginator}
                            route={props.route}
                            setChatSelected={setChatSelected}
                            setChats={setChats}
                            chats={chats}
                            invitation={invitation}
                            setInvitation={setInvitation}
                        />
                    }
                </div>
            </div>
        </BarLayout>
    );
}

export default Chats;